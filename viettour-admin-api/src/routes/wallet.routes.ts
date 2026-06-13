import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { canOverdraft, creditWalletAtomic, debitWalletAtomic, ensureVendorWallet } from '../services/wallet.service';
import { asyncHandler } from '../utils/asyncHandler';
import { parseMoney, requireReason, requireString, serializeForJson, toBigIntId } from '../utils/serialization';

export const router = Router();

const financeRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE];

router.use(authenticate, authorize(...financeRoles));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const vendors = await prisma.vendor.findMany({
      include: {
        wallet: true,
        subscription: { include: { plan: true } },
        stalls: { select: { id: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(ok(serializeForJson(vendors)));
  })
);

router.get(
  '/:vendorId',
  asyncHandler(async (req, res) => {
    const vendorId = toBigIntId(req.params.vendorId, 'vendor id');
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        wallet: { include: { transactions: { orderBy: { createdAt: 'desc' } } } },
        subscription: { include: { plan: true } },
        topUpRequests: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    if (!vendor.wallet) {
      const wallet = await ensureVendorWallet(vendorId);
      res.json(ok(serializeForJson({ ...vendor, wallet: { ...wallet, transactions: [] } })));
      return;
    }

    res.json(ok(serializeForJson(vendor)));
  })
);

router.post(
  '/:vendorId/credit',
  asyncHandler(async (req, res) => {
    const vendorId = toBigIntId(req.params.vendorId, 'vendor id');
    const amount = parseMoney(req.body.amount);
    const description = requireString(req.body.description, 'description');
    const reason = requireReason(req.body.reason);

    const before = await prisma.vendorWallet.findUnique({ where: { vendorId } });
    const result = await creditWalletAtomic({
      vendorId,
      amount,
      type: 'MANUAL_CREDIT',
      description
    });

    req.auditMeta = {
      action: 'WALLET_MANUAL_CREDIT',
      targetType: 'vendor_wallet',
      targetId: result.wallet.id,
      reason,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(result)
    };

    res.json(ok(serializeForJson(result)));
  })
);

router.post(
  '/:vendorId/debit',
  asyncHandler(async (req, res) => {
    const vendorId = toBigIntId(req.params.vendorId, 'vendor id');
    const amount = parseMoney(req.body.amount);
    const description = requireString(req.body.description, 'description');
    const reason = requireReason(req.body.reason);

    const before = await prisma.vendorWallet.findUnique({ where: { vendorId } });
    const result = await debitWalletAtomic({
      vendorId,
      amount,
      type: 'MANUAL_DEBIT',
      description,
      allowOverdraft: canOverdraft(req.user?.role)
    });

    req.auditMeta = {
      action: 'WALLET_MANUAL_DEBIT',
      targetType: 'vendor_wallet',
      targetId: result.wallet.id,
      reason,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(result)
    };

    res.json(ok(serializeForJson(result)));
  })
);

export default router;
