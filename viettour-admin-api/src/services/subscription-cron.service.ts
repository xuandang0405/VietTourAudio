import cron from 'node-cron';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { debitWalletTx, ensureVendorWallet } from './wallet.service';
import { serializeForJson } from '../utils/serialization';

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function runSubscriptionRenewalJob() {
  const now = new Date();
  const inThreeDays = addDays(now, 3);
  const overdueCutoff = addDays(now, -7);

  const expiring = await prisma.vendorSubscription.findMany({
    where: {
      status: 'ACTIVE',
      periodEnd: { lte: inThreeDays }
    },
    include: { plan: true, vendor: { include: { wallet: true } } }
  });

  for (const subscription of expiring) {
    await prisma.$transaction(async (tx) => {
      const wallet = await ensureVendorWallet(subscription.vendorId, tx);
      const balance = new Prisma.Decimal(wallet.balance);
      const price = new Prisma.Decimal(subscription.plan.monthlyPrice);

      if (balance.gte(price)) {
        const before = await tx.vendorSubscription.findUnique({ where: { id: subscription.id } });
        const walletResult = await debitWalletTx(tx, {
          vendorId: subscription.vendorId,
          amount: price,
          type: 'SUBSCRIPTION_FEE',
          description: `Auto-renew ${subscription.plan.name}`
        });
        const after = await tx.vendorSubscription.update({
          where: { id: subscription.id },
          data: { periodEnd: addDays(subscription.periodEnd, 30), status: 'ACTIVE' }
        });

        await tx.auditLog.create({
          data: {
            performedById: null,
            action: 'SUBSCRIPTION_AUTO_RENEW',
            targetType: 'vendor_subscription',
            targetId: subscription.id,
            targetLabel: subscription.vendor.businessName,
            beforeData: serializeForJson({ subscription: before, wallet }) as any,
            afterData: serializeForJson({ subscription: after, wallet: walletResult.wallet }) as any
          }
        });
        return;
      }

      const before = await tx.vendorSubscription.findUnique({ where: { id: subscription.id } });
      const after = await tx.vendorSubscription.update({
        where: { id: subscription.id },
        data: { status: 'OVERDUE' }
      });
      await tx.auditLog.create({
        data: {
          performedById: null,
          action: 'SUBSCRIPTION_OVERDUE',
          targetType: 'vendor_subscription',
          targetId: subscription.id,
          targetLabel: subscription.vendor.businessName,
          reason: 'Insufficient wallet balance for auto-renewal',
          beforeData: serializeForJson(before) as any,
          afterData: serializeForJson(after) as any
        }
      });
    });
  }

  const overdue = await prisma.vendorSubscription.findMany({
    where: {
      status: 'OVERDUE',
      periodEnd: { lt: overdueCutoff }
    },
    include: { vendor: true }
  });

  for (const subscription of overdue) {
    await prisma.$transaction(async (tx) => {
      const before = await tx.vendorSubscription.findUnique({ where: { id: subscription.id } });
      const after = await tx.vendorSubscription.update({
        where: { id: subscription.id },
        data: { status: 'SUSPENDED' }
      });
      await tx.stall.updateMany({
        where: { vendorId: subscription.vendorId },
        data: { status: 'HIDDEN' }
      });
      await tx.auditLog.create({
        data: {
          performedById: null,
          action: 'SUBSCRIPTION_SUSPEND_OVERDUE',
          targetType: 'vendor_subscription',
          targetId: subscription.id,
          targetLabel: subscription.vendor.businessName,
          reason: 'Subscription overdue for more than 7 days',
          beforeData: serializeForJson(before) as any,
          afterData: serializeForJson(after) as any
        }
      });
    });
  }
}

export function startSubscriptionCron() {
  cron.schedule('0 0 * * *', () => {
    runSubscriptionRenewalJob().catch((error) => {
      console.error('Subscription renewal cron failed:', error);
    });
  });
}
