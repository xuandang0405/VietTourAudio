import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { creditWalletTx } from '../services/wallet.service';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';
import { requireReason, serializeForJson, toBigIntId } from '../utils/serialization';

export const router = Router();

const financeRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE];

router.use(authenticate, authorize(...financeRoles));

router.get(
  '/requests',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const requests = await prisma.topUpRequest.findMany({
      where: status && status !== 'ALL' ? { status: status as any } : {},
      include: { vendor: { include: { wallet: true, subscription: { include: { plan: true } } } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(ok(serializeForJson(requests)));
  })
);

router.post(
  '/requests/:id/approve',
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'top-up request id');
    const before = await prisma.topUpRequest.findUnique({ where: { id }, include: { vendor: true } });
    if (!before) {
      res.status(404).json({ success: false, error: 'Top-up request not found' });
      return;
    }

    if (before.status !== 'PENDING') {
      res.status(409).json({ success: false, error: 'Top-up request is not pending' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.topUpRequest.update({
        where: { id },
        data: { status: 'APPROVED', rejectReason: null },
        include: { vendor: true }
      });

      const walletResult = await creditWalletTx(tx, {
        vendorId: request.vendorId,
        amount: request.amount,
        type: 'TOP_UP',
        description: `Top-up approved via ${request.provider}`
      });

      return { request, wallet: walletResult.wallet, transaction: walletResult.transaction };
    });

    req.auditMeta = {
      action: 'TOPUP_APPROVE',
      targetType: 'top_up_request',
      targetId: id,
      targetLabel: before.vendor.businessName,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(result)
    };

    res.json(ok(serializeForJson(result)));
  })
);

router.post(
  '/requests/:id/reject',
  asyncHandler(async (req, res) => {
    const reason = requireReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'top-up request id');
    const before = await prisma.topUpRequest.findUnique({ where: { id }, include: { vendor: true } });
    if (!before) {
      res.status(404).json({ success: false, error: 'Top-up request not found' });
      return;
    }

    const request = await prisma.topUpRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectReason: reason },
      include: { vendor: true }
    });

    req.auditMeta = {
      action: 'TOPUP_REJECT',
      targetType: 'top_up_request',
      targetId: id,
      targetLabel: request.vendor.businessName,
      reason,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(request)
    };

    res.json(ok(serializeForJson(request)));
  })
);

export default router;
