import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/domain';
import { query } from '../lib/db';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR, UserRole.FINANCE));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query<any[]>(
      `SELECT n.id, n.notification_type, n.title, n.message, n.is_read, n.created_at,
              v.trade_name AS vendor_name
       FROM admin_notifications n
       LEFT JOIN vendors v ON v.id = n.vendor_id
       ORDER BY n.created_at DESC
       LIMIT 30`
    );
    res.json(ok(rows.map((row) => ({
      id: String(row.id),
      type: row.notification_type,
      title: row.title,
      message: row.message,
      isRead: Boolean(row.is_read),
      vendorName: row.vendor_name,
      createdAt: row.created_at
    }))));
  })
);

router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await query('UPDATE admin_notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json(ok({ read: true }));
  })
);

export default router;
