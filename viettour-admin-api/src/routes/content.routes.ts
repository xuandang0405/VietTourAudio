import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';
import { requireReason, optionalReason, toBigIntId } from '../utils/serialization';

export const router = Router();

const moderationRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR];

router.use(authenticate, authorize(...moderationRoles));

router.get(
  '/queue',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'PENDING';
    const rows = await query<any[]>(
      `SELECT
         mf.*,
         v.trade_name,
         s.name AS stall_name,
         p.name AS poi_name
       FROM media_files mf
       LEFT JOIN vendors v ON v.id = mf.vendor_id
       LEFT JOIN stalls s ON s.id = mf.stall_id
       LEFT JOIN pois p ON p.id = mf.poi_id
       ${status === 'ALL' ? '' : 'WHERE mf.moderation_status = ?'}
       ORDER BY mf.created_at ASC`
      , status === 'ALL' ? [] : [status]
    );
    const items = rows.map(mapMedia);

    res.json(ok(items));
  })
);

router.post(
  '/:id/approve',
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'media id');
    const item = await getMedia(id);
    if (!item) {
      res.status(404).json({ success: false, error: 'Media file not found' });
      return;
    }

    await updateModeration(id, 'APPROVED', req.user!.userId);
    const result = await getMedia(id);
    req.auditMeta = {
      action: 'APPROVE_CONTENT',
      targetType: 'media_files',
      targetId: id,
      beforeData: item,
      afterData: result
    };

    res.json(ok(result));
  })
);

router.post(
  '/:id/reject',
  asyncHandler(async (req, res) => {
    const reason = optionalReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'media id');
    const item = await getMedia(id);
    if (!item) {
      res.status(404).json({ success: false, error: 'Media file not found' });
      return;
    }

    await updateModeration(id, 'REJECTED', req.user!.userId, reason);
    const result = await getMedia(id);
    req.auditMeta = {
      action: 'REJECT_CONTENT',
      targetType: 'media_files',
      targetId: id,
      reason,
      beforeData: item,
      afterData: result
    };

    res.json(ok(result));
  })
);

router.post(
  '/:id/hide',
  asyncHandler(async (req, res) => {
    const reason = requireReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'media id');
    const item = await getMedia(id);
    if (!item) {
      res.status(404).json({ success: false, error: 'Media file not found' });
      return;
    }

    await updateModeration(id, 'HIDDEN', req.user!.userId, reason);
    const result = await getMedia(id);
    req.auditMeta = {
      action: 'HIDE_CONTENT',
      targetType: 'media_files',
      targetId: id,
      reason,
      beforeData: item,
      afterData: result
    };

    res.json(ok(result));
  })
);

router.patch(
  '/bulk-approve',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map((id: string) => String(id)) : [];
    if (!ids.length) {
      res.status(400).json({ success: false, error: 'ids are required' });
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    await query(
      `UPDATE media_files
       SET moderation_status = 'APPROVED', moderated_by_user_id = ?, moderated_at = NOW(), rejection_reason = NULL
       WHERE id IN (${placeholders})`,
      [req.user!.userId.toString(), ...ids]
    );

    req.auditMeta = {
      action: 'BULK_APPROVE_CONTENT',
      targetType: 'media_files',
      afterData: { ids, count: ids.length }
    };

    res.json(ok({ count: ids.length }));
  })
);

async function getMedia(id: bigint) {
  const rows = await query<any[]>(
    `SELECT
       mf.*,
       v.trade_name,
       s.name AS stall_name,
       p.name AS poi_name
     FROM media_files mf
     LEFT JOIN vendors v ON v.id = mf.vendor_id
     LEFT JOIN stalls s ON s.id = mf.stall_id
     LEFT JOIN pois p ON p.id = mf.poi_id
     WHERE mf.id = ?
     LIMIT 1`,
    [id.toString()]
  );

  return rows[0] ? mapMedia(rows[0]) : null;
}

async function updateModeration(id: bigint, status: 'APPROVED' | 'REJECTED' | 'HIDDEN', actorId: bigint, reason?: string) {
  await query(
    `UPDATE media_files
     SET moderation_status = ?, moderated_by_user_id = ?, moderated_at = NOW(), rejection_reason = ?
     WHERE id = ?`,
    [status, actorId.toString(), reason ?? null, id.toString()]
  );
}

function mapMedia(row: any) {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    stallId: row.stall_id == null ? null : String(row.stall_id),
    poiId: row.poi_id == null ? null : String(row.poi_id),
    mediaType: row.file_type === 'LOGO' || row.file_type === 'QR' ? 'IMAGE' : row.file_type,
    storagePath: row.file_path,
    publicUrl: row.public_url || row.file_path,
    mimeType: row.mime_type,
    sizeBytes: row.file_size,
    moderationStatus: row.moderation_status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    vendor: row.trade_name ? { businessName: row.trade_name } : null,
    stall: row.stall_name ? { name: row.stall_name } : null,
    poi: row.poi_name ? { name: row.poi_name } : null
  };
}

export default router;
