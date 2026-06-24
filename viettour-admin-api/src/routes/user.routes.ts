import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.post(
  '/zone-admins',
  asyncHandler(async (req, res) => {
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const assignedZoneId = req.body.assignedZoneId == null ? '' : String(req.body.assignedZoneId);

    if (!fullName || !email || password.length < 6 || !assignedZoneId) {
      res.status(400).json({ success: false, error: 'fullName, email, password, and assignedZoneId are required' });
      return;
    }

    const zones = await query<any[]>('SELECT id FROM zones WHERE id = ? AND is_active = 1 LIMIT 1', [assignedZoneId]);
    if (zones.length === 0) {
      res.status(400).json({ success: false, error: 'Assigned zone is invalid' });
      return;
    }

    const passHash = await bcrypt.hash(password, 10);
    const result = await query<any>(
      `INSERT INTO users (email, pass_hash, full_name, role, assigned_zone_id, status)
       VALUES (?, ?, ?, 'ADMIN', ?, 'ACTIVE')`,
      [email, passHash, fullName, assignedZoneId]
    );

    const rows = await query<any[]>(
      `SELECT u.id, u.email, u.full_name, u.role, u.assigned_zone_id, u.status, u.created_at, z.name AS zone_name
       FROM users u
       LEFT JOIN zones z ON z.id = u.assigned_zone_id
       WHERE u.id = ?
       LIMIT 1`,
      [String(result.insertId)]
    );

    const user = rows[0];
    req.auditMeta = {
      action: 'CREATE_ZONE_ADMIN',
      targetType: 'users',
      targetId: BigInt(result.insertId),
      beforeData: null,
      afterData: user
    };

    res.json(
      ok({
        id: String(user.id),
        email: user.email,
        displayName: user.full_name,
        role: user.role,
        assignedZoneId: user.assigned_zone_id == null ? null : String(user.assigned_zone_id),
        assignedZoneName: user.zone_name,
        status: user.status,
        createdAt: user.created_at
      })
    );
  })
);

export default router;
