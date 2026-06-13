import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';
import { requireReason, serializeForJson, toBigIntId } from '../utils/serialization';

export const router = Router();

const vendorManagers = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate);

router.get(
  '/',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const vendors = await prisma.vendor.findMany({
      where: {
        ...(status && status !== 'ALL' ? { verificationStatus: status as any } : {}),
        ...(search
          ? {
              OR: [
                { businessName: { contains: search } },
                { ownerEmail: { contains: search } },
                { ownerDisplayName: { contains: search } }
              ]
            }
          : {})
      },
      include: {
        subscription: { include: { plan: true } },
        wallet: true,
        stalls: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(ok(serializeForJson(vendors)));
  })
);

router.get(
  '/:id',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } } },
        topUpRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
        stalls: { include: { pois: true, mediaFiles: true } },
        mediaFiles: { orderBy: { createdAt: 'desc' }, take: 30 }
      }
    });

    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    res.json(ok(serializeForJson(vendor)));
  })
);

router.post(
  '/:id/approve',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const before = await prisma.vendor.findUnique({ where: { id } });
    if (!before) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        verificationStatus: 'APPROVED',
        rejectionReason: null,
        approvedById: req.user!.userId,
        approvedAt: new Date()
      }
    });

    req.auditMeta = {
      action: 'VENDOR_APPROVE',
      targetType: 'vendor',
      targetId: id,
      targetLabel: vendor.businessName,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(vendor)
    };

    res.json(ok(serializeForJson(vendor)));
  })
);

router.post(
  '/:id/reject',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const reason = requireReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'vendor id');
    const before = await prisma.vendor.findUnique({ where: { id } });
    if (!before) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { verificationStatus: 'REJECTED', rejectionReason: reason }
    });

    req.auditMeta = {
      action: 'VENDOR_REJECT',
      targetType: 'vendor',
      targetId: id,
      targetLabel: vendor.businessName,
      reason,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(vendor)
    };

    res.json(ok(serializeForJson(vendor)));
  })
);

router.post(
  '/:id/suspend',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const reason = requireReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'vendor id');
    const before = await prisma.vendor.findUnique({ where: { id }, include: { stalls: true } });
    if (!before) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.update({
        where: { id },
        data: { verificationStatus: 'SUSPENDED' }
      });
      await tx.stall.updateMany({
        where: { vendorId: id, status: { not: 'FORCE_CANCELLED' } },
        data: { status: 'HIDDEN' }
      });
      return vendor;
    });

    req.auditMeta = {
      action: 'VENDOR_SUSPEND',
      targetType: 'vendor',
      targetId: id,
      targetLabel: result.businessName,
      reason,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(result)
    };

    res.json(ok(serializeForJson(result)));
  })
);

router.post(
  '/:id/force-cancel',
  authorize(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const reason = requireReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'vendor id');
    const before = await prisma.vendor.findUnique({ where: { id }, include: { stalls: true, subscription: true } });
    if (!before) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.update({
        where: { id },
        data: { verificationStatus: 'SUSPENDED' }
      });
      await tx.stall.updateMany({ where: { vendorId: id }, data: { status: 'FORCE_CANCELLED' } });
      await tx.vendorSubscription.updateMany({ where: { vendorId: id }, data: { status: 'CANCELLED' } });
      return vendor;
    });

    req.auditMeta = {
      action: 'VENDOR_FORCE_CANCEL',
      targetType: 'vendor',
      targetId: id,
      targetLabel: result.businessName,
      reason,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(result)
    };

    res.json(ok(serializeForJson(result)));
  })
);

export default router;
