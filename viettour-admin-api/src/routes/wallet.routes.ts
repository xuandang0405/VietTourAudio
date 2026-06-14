import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query, pool } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';
import { parseMoney, requireReason, requireString, toBigIntId } from '../utils/serialization';

export const router = Router();

const financeRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE];

router.use(authenticate, authorize(...financeRoles));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query<any[]>(
      `SELECT
         v.*,
         vw.id AS wallet_id, vw.balance, vw.total_top_up,
         vs.id AS subscription_id, vs.status AS subscription_status, vs.period_end,
         sp.id AS plan_id, sp.name AS plan_name, sp.price AS plan_price,
         (SELECT COUNT(*) FROM stalls s WHERE s.vendor_id = v.id) AS stall_count
       FROM vendors v
       LEFT JOIN vendor_wallets vw ON vw.vendor_id = v.id
       LEFT JOIN vendor_subscriptions vs ON vs.vendor_id = v.id
       LEFT JOIN subscription_plans sp ON sp.id = vs.plan_id
       ORDER BY v.created_at DESC`
    );

    res.json(ok(rows.map(mapVendorAccount)));
  })
);

router.get(
  '/:vendorId',
  asyncHandler(async (req, res) => {
    const vendorId = toBigIntId(req.params.vendorId, 'vendor id');
    const rows = await query<any[]>(
      `SELECT
         v.*,
         vw.id AS wallet_id, vw.balance, vw.total_top_up,
         vs.id AS subscription_id, vs.status AS subscription_status, vs.period_end,
         sp.id AS plan_id, sp.name AS plan_name, sp.price AS plan_price
       FROM vendors v
       LEFT JOIN vendor_wallets vw ON vw.vendor_id = v.id
       LEFT JOIN vendor_subscriptions vs ON vs.vendor_id = v.id
       LEFT JOIN subscription_plans sp ON sp.id = vs.plan_id
       WHERE v.id = ?
       LIMIT 1`,
      [vendorId.toString()]
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    const vendor = mapVendorAccount(rows[0]);
    if (!vendor.wallet) {
      await query('INSERT INTO vendor_wallets (vendor_id, balance, total_top_up, total_spent, total_commission) VALUES (?, 0, 0, 0, 0)', [
        vendorId.toString()
      ]);
      vendor.wallet = { id: '', balance: '0.00', totalTopUp: '0.00', transactions: [] };
    }

    const [transactions, topUps] = await Promise.all([
      query<any[]>(
        `SELECT wt.* FROM wallet_transactions wt
         JOIN vendor_wallets vw ON vw.id = wt.wallet_id
         WHERE vw.vendor_id = ?
         ORDER BY wt.created_at DESC`,
        [vendorId.toString()]
      ),
      query<any[]>('SELECT * FROM top_up_requests WHERE vendor_id = ? ORDER BY created_at DESC', [vendorId.toString()])
    ]);

    vendor.wallet.transactions = transactions.map(mapTransaction);
    vendor.topUpRequests = topUps.map(mapTopUp);

    res.json(ok(vendor));
  })
);

router.post(
  '/:vendorId/credit',
  asyncHandler(async (req, res) => {
    const vendorId = toBigIntId(req.params.vendorId, 'vendor id');
    const amount = parseMoney(req.body.amount);
    const description = requireString(req.body.description, 'description');
    const reason = requireReason(req.body.reason);
    const result = await adjustWallet({
      vendorId: vendorId.toString(),
      amount: amount.toString(),
      direction: 'CREDIT',
      description,
      actorUserId: req.user!.userId.toString()
    });

    req.auditMeta = {
      action: 'WALLET_MANUAL_CREDIT',
      targetType: 'vendor_wallets',
      targetId: BigInt(result.wallet.id),
      reason,
      afterData: result
    };

    res.json(ok(result));
  })
);

router.post(
  '/:vendorId/debit',
  asyncHandler(async (req, res) => {
    const vendorId = toBigIntId(req.params.vendorId, 'vendor id');
    const amount = parseMoney(req.body.amount);
    const description = requireString(req.body.description, 'description');
    const reason = requireReason(req.body.reason);
    const result = await adjustWallet({
      vendorId: vendorId.toString(),
      amount: amount.toString(),
      direction: 'DEBIT',
      description,
      actorUserId: req.user!.userId.toString(),
      allowOverdraft: req.user?.role === UserRole.SUPER_ADMIN
    });

    req.auditMeta = {
      action: 'WALLET_MANUAL_DEBIT',
      targetType: 'vendor_wallets',
      targetId: BigInt(result.wallet.id),
      reason,
      afterData: result
    };

    res.json(ok(result));
  })
);

async function adjustWallet(input: {
  vendorId: string;
  amount: string;
  direction: 'CREDIT' | 'DEBIT';
  description: string;
  actorUserId: string;
  allowOverdraft?: boolean;
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [walletRows] = await connection.execute<any[]>(
      'SELECT * FROM vendor_wallets WHERE vendor_id = ? FOR UPDATE',
      [input.vendorId]
    );
    let wallet = walletRows[0];

    if (!wallet) {
      await connection.execute(
        'INSERT INTO vendor_wallets (vendor_id, balance, total_top_up, total_spent, total_commission) VALUES (?, 0, 0, 0, 0)',
        [input.vendorId]
      );
      const [newRows] = await connection.execute<any[]>('SELECT * FROM vendor_wallets WHERE vendor_id = ? FOR UPDATE', [input.vendorId]);
      wallet = newRows[0];
    }

    const balanceBefore = Number(wallet.balance);
    const amount = Number(input.amount);
    const balanceAfter = input.direction === 'CREDIT' ? balanceBefore + amount : balanceBefore - amount;

    if (balanceAfter < 0 && !input.allowOverdraft) {
      await connection.rollback();
      const error = Object.assign(new Error('Insufficient wallet balance'), { statusCode: 409 });
      throw error;
    }

    await connection.execute(
      `UPDATE vendor_wallets
       SET balance = ?, total_top_up = total_top_up + ?, total_spent = total_spent + ?
       WHERE id = ?`,
      [balanceAfter, input.direction === 'CREDIT' ? amount : 0, input.direction === 'DEBIT' ? amount : 0, wallet.id]
    );

    const [txResult] = await connection.execute<any>(
      `INSERT INTO wallet_transactions
        (wallet_id, vendor_id, transaction_type, direction, amount, balance_before, balance_after, description, created_by_user_id)
       VALUES (?, ?, 'MANUAL', ?, ?, ?, ?, ?, ?)`,
      [wallet.id, input.vendorId, input.direction, amount, balanceBefore, balanceAfter, input.description, input.actorUserId]
    );

    await connection.commit();

    return {
      wallet: {
        id: String(wallet.id),
        vendorId: input.vendorId,
        balance: balanceAfter.toFixed(2),
        totalTopUp: wallet.total_top_up
      },
      transaction: {
        id: String(txResult.insertId),
        walletId: String(wallet.id),
        type: input.direction === 'CREDIT' ? 'MANUAL_CREDIT' : 'MANUAL_DEBIT',
        amount: input.direction === 'CREDIT' ? amount.toFixed(2) : `-${amount.toFixed(2)}`,
        balanceAfter: balanceAfter.toFixed(2),
        description: input.description,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function mapVendorAccount(row: any): any {
  return {
    id: String(row.id),
    businessName: row.trade_name,
    ownerEmail: row.contact_email,
    ownerDisplayName: row.contact_name,
    contactPhone: row.phone,
    verificationStatus: row.status,
    createdAt: row.created_at,
    wallet: row.wallet_id
      ? {
          id: String(row.wallet_id),
          balance: row.balance,
          totalTopUp: row.total_top_up,
          transactions: []
        }
      : null,
    subscription: row.subscription_id
      ? {
          id: String(row.subscription_id),
          status: row.subscription_status,
          periodEnd: row.period_end,
          plan: {
            id: row.plan_id == null ? null : String(row.plan_id),
            name: row.plan_name,
            monthlyPrice: row.plan_price
          }
        }
      : null,
    stalls: Array.from({ length: Number(row.stall_count ?? 0) }, (_item, index) => ({ id: `${row.id}-${index + 1}` }))
  };
}

function mapTransaction(tx: any) {
  return {
    id: String(tx.id),
    walletId: String(tx.wallet_id),
    type: tx.transaction_type === 'FEE' ? 'SUBSCRIPTION_FEE' : tx.transaction_type === 'MANUAL' && tx.direction === 'DEBIT' ? 'MANUAL_DEBIT' : tx.transaction_type === 'MANUAL' ? 'MANUAL_CREDIT' : 'TOP_UP',
    amount: tx.direction === 'DEBIT' ? `-${tx.amount}` : tx.amount,
    balanceAfter: tx.balance_after,
    description: tx.description,
    createdAt: tx.created_at
  };
}

function mapTopUp(row: any) {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    amount: row.amount,
    provider: row.provider,
    status: row.status,
    proofImageUrl: row.proof_url,
    rejectReason: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export default router;
