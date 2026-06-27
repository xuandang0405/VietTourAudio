import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { query } from '../lib/db';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();

const moderationRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR];

router.use(authenticate, authorize(...moderationRoles));

// GET /pending — Retrieve pending narrations (poi_contents)
router.get(
  '/pending',
  asyncHandler(async (req, res) => {
    const rows = await query<any[]>(
      `SELECT pc.id, pc.poi_id AS zoneId, pc.lang AS language, pc.tts_script AS text, pc.approval_status AS approvalStatus
       FROM poi_contents pc
       WHERE pc.approval_status = 'pending'
       ORDER BY pc.id DESC`
    );
    res.json(ok(rows.map(r => ({
      id: String(r.id),
      zoneId: Number(r.zoneId),
      language: r.language,
      text: r.text,
      approvalStatus: r.approvalStatus
    }))));
  })
);

// POST /:id/approve — Approve a narration script
router.post(
  '/:id/approve',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    await query(
      `UPDATE poi_contents SET approval_status = 'approved', updated_at = NOW() WHERE id = ?`,
      [id]
    );
    res.json(ok({ approved: true }));
  })
);

// POST /:id/reject — Reject a narration script
router.post(
  '/:id/reject',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { reason } = req.body;
    await query(
      `UPDATE poi_contents SET approval_status = 'rejected', updated_at = NOW() WHERE id = ?`,
      [id]
    );
    res.json(ok({ rejected: true }));
  })
);

export default router;
