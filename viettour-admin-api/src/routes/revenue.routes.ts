import { Router } from 'express';
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';
import { serializeForJson } from '../utils/serialization';

export const router = Router();

const financeRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE];

router.use(authenticate, authorize(...financeRoles));

function periodStart(period?: string) {
  const now = new Date();
  const start = new Date(now);
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === 'ytd') {
    return new Date(now.getFullYear(), 0, 1);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function decimalToString(value: Prisma.Decimal | null | undefined) {
  return (value ?? new Prisma.Decimal(0)).toString();
}

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const start = periodStart(typeof req.query.period === 'string' ? req.query.period : 'month');

    const [paidPayments, approvedTopups, activeSubs, providerGroups, renewalTxs] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: start } },
        _sum: { amount: true }
      }),
      prisma.topUpRequest.aggregate({
        where: { status: 'APPROVED', updatedAt: { gte: start } },
        _sum: { amount: true }
      }),
      prisma.vendorSubscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true }
      }),
      prisma.payment.groupBy({
        by: ['provider'],
        where: { status: 'PAID', paidAt: { gte: start } },
        _sum: { amount: true }
      }),
      prisma.walletTransaction.count({
        where: { type: 'SUBSCRIPTION_FEE', createdAt: { gte: start } }
      })
    ]);

    const mrr = activeSubs.reduce(
      (sum, subscription) => sum.plus(subscription.plan.monthlyPrice),
      new Prisma.Decimal(0)
    );

    res.json(
      ok(
        serializeForJson({
          totalRevenue: decimalToString(paidPayments._sum.amount),
          totalTopUps: decimalToString(approvedTopups._sum.amount),
          mrr: mrr.toString(),
          activeSubscriptions: activeSubs.length,
          renewals: renewalTxs,
          providers: providerGroups.map((group) => ({
            provider: group.provider,
            amount: decimalToString(group._sum.amount)
          }))
        })
      )
    );
  })
);

router.get(
  '/timeline',
  asyncHandler(async (req, res) => {
    const start = periodStart(typeof req.query.period === 'string' ? req.query.period : 'month');
    const rows = await prisma.revenueDaily.findMany({
      where: { date: { gte: start } },
      orderBy: { date: 'asc' }
    });

    res.json(ok(serializeForJson(rows)));
  })
);

router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const start = periodStart(typeof req.query.period === 'string' ? req.query.period : 'month');
    const rows = await prisma.revenueDaily.findMany({
      where: { date: { gte: start } },
      orderBy: [{ date: 'asc' }, { source: 'asc' }, { provider: 'asc' }]
    });

    const csv = [
      'date,source,provider,total_amount',
      ...rows.map((row) => `${row.date.toISOString().slice(0, 10)},${row.source},${row.provider},${row.totalAmount.toString()}`)
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="viettour-revenue.csv"');
    res.send(csv);
  })
);

export default router;
