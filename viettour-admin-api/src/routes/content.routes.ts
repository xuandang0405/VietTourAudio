import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';
import { requireReason, serializeForJson, toBigIntId } from '../utils/serialization';

export const router = Router();

const moderationRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR];

router.use(authenticate, authorize(...moderationRoles));

router.get(
  '/queue',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'PENDING';
    const items = await prisma.mediaFile.findMany({
      where: status === 'ALL' ? {} : { moderationStatus: status as any },
      include: {
        vendor: true,
        stall: true,
        poi: true,
        moderatedBy: { select: { id: true, email: true, displayName: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(ok(serializeForJson(items)));
  })
);

router.post(
  '/:id/approve',
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'media id');
    const before = await prisma.mediaFile.findUnique({ where: { id } });
    if (!before) {
      res.status(404).json({ success: false, error: 'Media file not found' });
      return;
    }

    const item = await prisma.mediaFile.update({
      where: { id },
      data: {
        moderationStatus: 'APPROVED',
        rejectionReason: null,
        moderatedById: req.user!.userId,
        moderatedAt: new Date()
      }
    });

    req.auditMeta = {
      action: 'CONTENT_APPROVE',
      targetType: 'media',
      targetId: id,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(item)
    };

    res.json(ok(serializeForJson(item)));
  })
);

router.post(
  '/:id/reject',
  asyncHandler(async (req, res) => {
    const reason = requireReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'media id');
    const before = await prisma.mediaFile.findUnique({ where: { id } });
    if (!before) {
      res.status(404).json({ success: false, error: 'Media file not found' });
      return;
    }

    const item = await prisma.mediaFile.update({
      where: { id },
      data: {
        moderationStatus: 'REJECTED',
        rejectionReason: reason,
        moderatedById: req.user!.userId,
        moderatedAt: new Date()
      }
    });

    req.auditMeta = {
      action: 'CONTENT_REJECT',
      targetType: 'media',
      targetId: id,
      reason,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(item)
    };

    res.json(ok(serializeForJson(item)));
  })
);

router.post(
  '/:id/hide',
  asyncHandler(async (req, res) => {
    const reason = requireReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'media id');
    const before = await prisma.mediaFile.findUnique({ where: { id } });
    if (!before) {
      res.status(404).json({ success: false, error: 'Media file not found' });
      return;
    }

    const item = await prisma.mediaFile.update({
      where: { id },
      data: {
        moderationStatus: 'HIDDEN',
        rejectionReason: reason,
        moderatedById: req.user!.userId,
        moderatedAt: new Date()
      }
    });

    req.auditMeta = {
      action: 'CONTENT_HIDE',
      targetType: 'media',
      targetId: id,
      reason,
      beforeData: serializeForJson(before),
      afterData: serializeForJson(item)
    };

    res.json(ok(serializeForJson(item)));
  })
);

router.patch(
  '/bulk-approve',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map((id: string) => toBigIntId(id, 'media id')) : [];
    if (!ids.length) {
      res.status(400).json({ success: false, error: 'ids are required' });
      return;
    }

    const before = await prisma.mediaFile.findMany({ where: { id: { in: ids } } });
    const result = await prisma.mediaFile.updateMany({
      where: { id: { in: ids }, moderationStatus: 'PENDING' },
      data: {
        moderationStatus: 'APPROVED',
        moderatedById: req.user!.userId,
        moderatedAt: new Date()
      }
    });

    req.auditMeta = {
      action: 'CONTENT_BULK_APPROVE',
      targetType: 'media',
      beforeData: serializeForJson(before),
      afterData: serializeForJson(result)
    };

    res.json(ok(serializeForJson(result)));
  })
);

export default router;
