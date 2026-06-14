import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();

const financeRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE];

router.use(authenticate, authorize(...financeRoles));

function periodStart(period?: string) {
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'ytd') return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function sqlDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const start = sqlDate(periodStart(typeof req.query.period === 'string' ? req.query.period : 'month'));

    const [revenueRows, topUpRows, mrrRows, providerRows, renewalRows] = await Promise.all([
      query<any[]>('SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = ? AND paid_at >= ?', ['PAID', start]),
      query<any[]>('SELECT COALESCE(SUM(amount), 0) AS total FROM top_up_requests WHERE status = ? AND updated_at >= ?', [
        'APPROVED',
        start
      ]),
      query<any[]>(
        `SELECT COALESCE(SUM(sp.price), 0) AS mrr, COUNT(*) AS active_count
         FROM vendor_subscriptions vs
         JOIN subscription_plans sp ON sp.id = vs.plan_id
         WHERE vs.status = 'ACTIVE'`
      ),
      query<any[]>(
        `SELECT provider, COALESCE(SUM(amount), 0) AS amount
         FROM payments
         WHERE status = ? AND paid_at >= ?
         GROUP BY provider`,
        ['PAID', start]
      ),
      query<any[]>(
        `SELECT COUNT(*) AS total
         FROM wallet_transactions
         WHERE transaction_type = 'FEE' AND created_at >= ?`,
        [start]
      )
    ]);

    res.json(
      ok({
        totalRevenue: revenueRows[0]?.total ?? '0.00',
        totalTopUps: topUpRows[0]?.total ?? '0.00',
        mrr: mrrRows[0]?.mrr ?? '0.00',
        activeSubscriptions: Number(mrrRows[0]?.active_count ?? 0),
        renewals: Number(renewalRows[0]?.total ?? 0),
        providers: providerRows.map((row) => ({ provider: row.provider, amount: row.amount }))
      })
    );
  })
);

router.get(
  '/timeline',
  asyncHandler(async (req, res) => {
    const start = sqlDate(periodStart(typeof req.query.period === 'string' ? req.query.period : 'month'));
    const rows = await query<any[]>(
      `SELECT date, source, provider, gross_amount AS totalAmount
       FROM revenue_daily
       WHERE date >= ?
       ORDER BY date ASC`,
      [start]
    );

    res.json(ok(rows));
  })
);

router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const start = sqlDate(periodStart(typeof req.query.period === 'string' ? req.query.period : 'month'));
    const rows = await query<any[]>(
      `SELECT date, source, provider, gross_amount, net_amount, fees, transaction_count
       FROM revenue_daily
       WHERE date >= ?
       ORDER BY date ASC, source ASC, provider ASC`,
      [start]
    );

    const csv = [
      'date,source,provider,gross_amount,net_amount,fees,transaction_count',
      ...rows.map((row) => `${new Date(row.date).toISOString().slice(0, 10)},${row.source},${row.provider},${row.gross_amount},${row.net_amount},${row.fees},${row.transaction_count}`)
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="viettour-revenue.csv"');
    res.send(csv);
  })
);

export default router;
