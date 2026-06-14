import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query, pool } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';
import { requireReason, toBigIntId } from '../utils/serialization';

export const router = Router();

const financeRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE];

router.use(authenticate, authorize(...financeRoles));

router.get(
  '/requests',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'PENDING';
    const params: unknown[] = [];
    const where = status && status !== 'ALL' ? 'WHERE tur.status = ?' : '';
    if (where) params.push(status);

    const rows = await query<any[]>(
      `SELECT
         tur.*,
         v.trade_name, v.contact_email,
         vw.balance, vw.total_top_up,
         vs.status AS subscription_status,
         sp.name AS plan_name, sp.price AS plan_price
       FROM top_up_requests tur
       JOIN vendors v ON v.id = tur.vendor_id
       LEFT JOIN vendor_wallets vw ON vw.id = tur.wallet_id
       LEFT JOIN vendor_subscriptions vs ON vs.vendor_id = v.id
       LEFT JOIN subscription_plans sp ON sp.id = vs.plan_id
       ${where}
       ORDER BY tur.created_at DESC`,
      params
    );

    res.json(ok(rows.map(mapTopUpRequest)));
  })
);

router.post(
  '/requests/:id/approve',
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'top-up request id');
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [requestRows] = await connection.execute<any[]>(
        `SELECT tur.*, v.trade_name
         FROM top_up_requests tur
         JOIN vendors v ON v.id = tur.vendor_id
         WHERE tur.id = ?
         FOR UPDATE`,
        [id.toString()]
      );
      const request = requestRows[0];

      if (!request) {
        await connection.rollback();
        res.status(404).json({ success: false, error: 'Top-up request not found' });
        return;
      }

      if (request.status !== 'PENDING') {
        await connection.rollback();
        res.status(409).json({ success: false, error: 'Top-up request is not pending' });
        return;
      }

      const [walletRows] = await connection.execute<any[]>('SELECT * FROM vendor_wallets WHERE id = ? FOR UPDATE', [request.wallet_id]);
      const wallet = walletRows[0];
      if (!wallet) {
        await connection.rollback();
        res.status(404).json({ success: false, error: 'Wallet not found' });
        return;
      }

      const amount = Number(request.amount);
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      await connection.execute('UPDATE top_up_requests SET status = ?, reviewed_by_user_id = ?, reviewed_at = NOW() WHERE id = ?', [
        'APPROVED',
        req.user!.userId.toString(),
        id.toString()
      ]);
      await connection.execute('UPDATE vendor_wallets SET balance = ?, total_top_up = total_top_up + ? WHERE id = ?', [
        balanceAfter,
        amount,
        wallet.id
      ]);
      const [txResult] = await connection.execute<any>(
        `INSERT INTO wallet_transactions
          (wallet_id, vendor_id, top_up_request_id, transaction_type, direction, amount, balance_before, balance_after, description, created_by_user_id)
         VALUES (?, ?, ?, 'TOP_UP', 'CREDIT', ?, ?, ?, ?, ?)`,
        [
          wallet.id,
          request.vendor_id,
          request.id,
          amount,
          balanceBefore,
          balanceAfter,
          `Top-up approved via ${request.provider}`,
          req.user!.userId.toString()
        ]
      );

      await connection.commit();

      const result = {
        request: { ...mapTopUpRequest(request), status: 'APPROVED' },
        wallet: { id: String(wallet.id), balance: balanceAfter.toFixed(2) },
        transaction: { id: String(txResult.insertId), amount: amount.toFixed(2), balanceAfter: balanceAfter.toFixed(2) }
      };

      req.auditMeta = {
        action: 'APPROVE_TOP_UP',
        targetType: 'top_up_requests',
        targetId: id,
        beforeData: request,
        afterData: result
      };

      res.json(ok(result));
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

router.post(
  '/requests/:id/reject',
  asyncHandler(async (req, res) => {
    const reason = requireReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'top-up request id');
    const rows = await query<any[]>('SELECT * FROM top_up_requests WHERE id = ? LIMIT 1', [id.toString()]);
    const before = rows[0];

    if (!before) {
      res.status(404).json({ success: false, error: 'Top-up request not found' });
      return;
    }

    await query('UPDATE top_up_requests SET status = ?, note = ?, reviewed_by_user_id = ?, reviewed_at = NOW() WHERE id = ?', [
      'REJECTED',
      reason,
      req.user!.userId.toString(),
      id.toString()
    ]);

    const afterRows = await query<any[]>('SELECT * FROM top_up_requests WHERE id = ? LIMIT 1', [id.toString()]);
    req.auditMeta = {
      action: 'REJECT_TOP_UP',
      targetType: 'top_up_requests',
      targetId: id,
      reason,
      beforeData: before,
      afterData: afterRows[0]
    };

    res.json(ok(mapTopUpRequest(afterRows[0])));
  })
);

function mapTopUpRequest(row: any) {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    amount: row.amount,
    provider: row.provider,
    status: row.status,
    proofImageUrl: row.proof_url,
    rejectReason: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vendor: {
      id: String(row.vendor_id),
      businessName: row.trade_name,
      ownerEmail: row.contact_email,
      wallet: row.balance == null ? null : { balance: row.balance, totalTopUp: row.total_top_up },
      subscription: row.subscription_status
        ? {
            status: row.subscription_status,
            plan: { name: row.plan_name, monthlyPrice: row.plan_price }
          }
        : null
    }
  };
}

export default router;
