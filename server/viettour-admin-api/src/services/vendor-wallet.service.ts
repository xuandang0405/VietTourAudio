import { PoolConnection } from 'mysql2/promise';
import { pool } from '../lib/db';

const BILLING_GRACE_DAYS = Number(process.env.VENDOR_BILLING_GRACE_DAYS ?? 7);

function httpError(message: string, statusCode: number, code: string, details?: Record<string, unknown>) {
  return Object.assign(new Error(message), { statusCode, code, details });
}

async function insertNotification(
  connection: PoolConnection,
  vendorId: string,
  type: 'WEBAPP_RENT_PAID' | 'WEBAPP_RENT_OVERDUE' | 'PREMIUM_UPGRADE',
  title: string,
  message: string,
  metadata: Record<string, unknown>
) {
  await connection.execute(
    `INSERT INTO admin_notifications
      (vendor_id, notification_type, title, message, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [vendorId, type, title, message, JSON.stringify(metadata)]
  );
}

export async function chargeMonthlyRent(vendorId: string) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [subscriptionRows] = await connection.execute<any[]>(
      `SELECT id, status, payment_status, price_snapshot, next_billing_date,
              DATEDIFF(CURDATE(), COALESCE(next_billing_date, CURDATE())) AS overdue_days,
              COALESCE(next_billing_date, CURDATE()) > CURDATE() AS is_future
       FROM vendor_subscriptions
       WHERE vendor_id = ?
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [vendorId]
    );
    const subscription = subscriptionRows[0];
    if (!subscription) {
      throw httpError('Không tìm thấy gói thuê WebApp của Vendor.', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    const [walletRows] = await connection.execute<any[]>(
      'SELECT id, balance FROM vendor_wallets WHERE vendor_id = ? LIMIT 1 FOR UPDATE',
      [vendorId]
    );
    const wallet = walletRows[0];
    if (!wallet) {
      throw httpError('Không tìm thấy ví của Vendor.', 404, 'WALLET_NOT_FOUND');
    }

    const fee = Number(subscription.price_snapshot);
    const balanceBefore = Number(wallet.balance);
    const overdueDays = Math.max(0, Number(subscription.overdue_days ?? 0));
    if (subscription.payment_status === 'paid' && Boolean(subscription.is_future)) {
      throw httpError('Kỳ thuê hiện tại đã được thanh toán.', 409, 'BILLING_PERIOD_ALREADY_PAID', {
        nextBillingDate: subscription.next_billing_date
      });
    }
    if (!Number.isFinite(fee) || fee <= 0) {
      throw httpError('Phí thuê WebApp không hợp lệ.', 409, 'INVALID_RENT_FEE');
    }

    if (balanceBefore < fee) {
      await connection.execute(
        `UPDATE vendor_subscriptions
         SET status = 'OVERDUE', payment_status = 'unpaid', updated_at = NOW()
         WHERE id = ?`,
        [subscription.id]
      );

      const shouldSuspend = overdueDays >= BILLING_GRACE_DAYS;
      if (shouldSuspend) {
        await connection.execute(
          `UPDATE stalls
           SET status = 'SUSPENDED', billing_suspended = 1, updated_at = NOW()
           WHERE vendor_id = ? AND status = 'APPROVED'`,
          [vendorId]
        );
      }

      if (subscription.status !== 'OVERDUE' || overdueDays === BILLING_GRACE_DAYS) {
        await insertNotification(
          connection,
          vendorId,
          'WEBAPP_RENT_OVERDUE',
          'Vendor không đủ số dư thanh toán phí thuê',
          shouldSuspend
            ? `Sạp đã bị ẩn sau ${BILLING_GRACE_DAYS} ngày quá hạn.`
            : `Vendor cần nạp thêm tiền; sạp sẽ bị ẩn sau ${BILLING_GRACE_DAYS} ngày quá hạn.`,
          { subscriptionId: String(subscription.id), fee, balance: balanceBefore, overdueDays, suspended: shouldSuspend }
        );
      }

      await connection.commit();
      throw httpError(
        shouldSuspend
          ? 'Số dư không đủ. Sạp đã bị ẩn do quá thời gian gia hạn.'
          : `Số dư không đủ. Vui lòng nạp thêm tiền trong thời gian gia hạn ${BILLING_GRACE_DAYS} ngày.`,
        409,
        'INSUFFICIENT_BALANCE',
        { balance: balanceBefore, required: fee, overdueDays, graceDays: BILLING_GRACE_DAYS, suspended: shouldSuspend }
      );
    }

    const balanceAfter = balanceBefore - fee;
    await connection.execute(
      `UPDATE vendor_wallets
       SET balance = ?, total_spent = total_spent + ?, updated_at = NOW()
       WHERE id = ?`,
      [balanceAfter, fee, wallet.id]
    );
    const [txResult] = await connection.execute<any>(
      `INSERT INTO wallet_transactions
        (wallet_id, vendor_id, transaction_type, transaction_category, direction, amount,
         balance_before, balance_after, description, metadata)
       VALUES (?, ?, 'FEE', 'WEBAPP_MONTHLY_RENT', 'DEBIT', ?, ?, ?, ?, ?)`,
      [
        wallet.id,
        vendorId,
        fee,
        balanceBefore,
        balanceAfter,
        'Phí thuê WebApp hàng tháng',
        JSON.stringify({ subscriptionId: String(subscription.id), billingDate: subscription.next_billing_date })
      ]
    );
    await connection.execute(
      `UPDATE vendor_subscriptions
       SET status = 'ACTIVE',
           payment_status = 'paid',
           period_start = COALESCE(next_billing_date, CURDATE()),
           period_end = DATE_ADD(COALESCE(next_billing_date, CURDATE()), INTERVAL 1 MONTH),
           next_billing_date = DATE_ADD(COALESCE(next_billing_date, CURDATE()), INTERVAL 1 MONTH),
           updated_at = NOW()
       WHERE id = ?`,
      [subscription.id]
    );
    await connection.execute(
      `UPDATE stalls
       SET status = 'APPROVED', billing_suspended = 0, updated_at = NOW()
       WHERE vendor_id = ? AND billing_suspended = 1`,
      [vendorId]
    );
    await insertNotification(
      connection,
      vendorId,
      'WEBAPP_RENT_PAID',
      'Đã thu phí thuê WebApp hàng tháng',
      `Đã trừ ${fee.toLocaleString('vi-VN')} VND từ ví Vendor.`,
      { transactionId: String(txResult.insertId), subscriptionId: String(subscription.id), fee, balanceAfter }
    );
    const [updatedRows] = await connection.execute<any[]>(
      'SELECT next_billing_date FROM vendor_subscriptions WHERE id = ?',
      [subscription.id]
    );
    await connection.commit();
    return {
      paid: true,
      transactionId: String(txResult.insertId),
      amount: fee,
      balanceAfter,
      nextBillingDate: updatedRows[0]?.next_billing_date
    };
  } catch (error: any) {
    if (!error?.code || !['INSUFFICIENT_BALANCE'].includes(error.code)) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function upgradeVendorToPremium(vendorId: string) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [stallRows] = await connection.execute<any[]>(
      'SELECT id, is_premium FROM stalls WHERE vendor_id = ? ORDER BY id ASC LIMIT 1 FOR UPDATE',
      [vendorId]
    );
    if (!stallRows[0]) throw httpError('Không tìm thấy sạp của Vendor.', 404, 'STALL_NOT_FOUND');
    if (Boolean(stallRows[0].is_premium)) throw httpError('Sạp đã là Premium.', 409, 'ALREADY_PREMIUM');

    const [planRows] = await connection.execute<any[]>(
      `SELECT id, price FROM subscription_plans
       WHERE code = 'PREMIUM_MONTHLY' AND is_active = 1 LIMIT 1`
    );
    const plan = planRows[0];
    if (!plan) throw httpError('Gói Premium chưa được cấu hình.', 409, 'PREMIUM_PLAN_NOT_CONFIGURED');

    const [walletRows] = await connection.execute<any[]>(
      'SELECT id, balance FROM vendor_wallets WHERE vendor_id = ? LIMIT 1 FOR UPDATE',
      [vendorId]
    );
    const wallet = walletRows[0];
    if (!wallet) throw httpError('Không tìm thấy ví của Vendor.', 404, 'WALLET_NOT_FOUND');
    const fee = Number(plan.price);
    const balanceBefore = Number(wallet.balance);
    if (balanceBefore < fee) {
      throw httpError('Số dư ví không đủ để nâng cấp Premium. Vui lòng nạp thêm tiền.', 409, 'INSUFFICIENT_BALANCE', {
        balance: balanceBefore,
        required: fee
      });
    }

    const balanceAfter = balanceBefore - fee;
    await connection.execute(
      'UPDATE vendor_wallets SET balance = ?, total_spent = total_spent + ?, updated_at = NOW() WHERE id = ?',
      [balanceAfter, fee, wallet.id]
    );
    const [txResult] = await connection.execute<any>(
      `INSERT INTO wallet_transactions
        (wallet_id, vendor_id, transaction_type, transaction_category, direction, amount,
         balance_before, balance_after, description, metadata)
       VALUES (?, ?, 'FEE', 'PREMIUM_UPGRADE', 'DEBIT', ?, ?, ?, 'Phí nâng cấp Premium', ?)`,
      [wallet.id, vendorId, fee, balanceBefore, balanceAfter, JSON.stringify({ planId: String(plan.id) })]
    );
    const [subscriptionUpdate] = await connection.execute<any>(
      `UPDATE vendor_subscriptions
       SET plan_id = ?, status = 'ACTIVE', payment_status = 'paid', price_snapshot = ?,
           period_start = CURDATE(), period_end = DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
           next_billing_date = DATE_ADD(CURDATE(), INTERVAL 1 MONTH), updated_at = NOW()
       WHERE vendor_id = ?
       ORDER BY id DESC LIMIT 1`,
      [plan.id, fee, vendorId]
    );
    if (subscriptionUpdate.affectedRows === 0) {
      await connection.execute(
        `INSERT INTO vendor_subscriptions
          (vendor_id, plan_id, status, period_start, period_end, next_billing_date, payment_status, price_snapshot)
         VALUES (?, ?, 'ACTIVE', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
                 DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'paid', ?)`,
        [vendorId, plan.id, fee]
      );
    }
    await connection.execute(
      `UPDATE stalls
       SET is_premium = 1, activation_radius = GREATEST(activation_radius, 10),
           priority_score = GREATEST(priority_score, 100), updated_at = NOW()
       WHERE vendor_id = ?`,
      [vendorId]
    );
    await insertNotification(
      connection,
      vendorId,
      'PREMIUM_UPGRADE',
      'Vendor đã nâng cấp Premium',
      `Đã trừ ${fee.toLocaleString('vi-VN')} VND từ cùng ví Vendor.`,
      { transactionId: String(txResult.insertId), fee, balanceAfter }
    );
    await connection.commit();
    return { upgraded: true, transactionId: String(txResult.insertId), amount: fee, balanceAfter };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function processDueVendorSubscriptions() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<any[]>(
      `SELECT vendor_id
       FROM vendor_subscriptions
       WHERE status IN ('ACTIVE', 'OVERDUE')
         AND next_billing_date IS NOT NULL
         AND next_billing_date <= CURDATE()`
    );
    for (const row of rows) {
      try {
        await chargeMonthlyRent(String(row.vendor_id));
      } catch (error: any) {
        if (error?.code !== 'INSUFFICIENT_BALANCE') {
          console.error(`Automatic billing failed for vendor ${row.vendor_id}:`, error);
        }
      }
    }
    return rows.length;
  } finally {
    connection.release();
  }
}
