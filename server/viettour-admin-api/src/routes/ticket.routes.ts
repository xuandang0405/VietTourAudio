import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';
import { toBigIntId } from '../utils/serialization';

export const router = Router();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

// GET /admin/tickets — List all support/registration tickets
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query<any[]>(
      `SELECT id, sender_email, subject, message, status, created_at
       FROM system_tickets
       ORDER BY created_at DESC`
    );

    res.json(
      ok(
        rows.map((r) => ({
          id: String(r.id),
          senderEmail: r.sender_email,
          subject: r.subject,
          message: r.message,
          status: r.status,
          createdAt: r.created_at
        }))
      )
    );
  })
);

// POST /admin/tickets/:id/resolve — Mark a ticket as resolved (PROCESSED)
router.post(
  '/:id/resolve',
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'ticket id');

    const [ticket] = await query<any[]>(
      'SELECT id FROM system_tickets WHERE id = ? LIMIT 1',
      [id.toString()]
    );

    if (!ticket) {
      res.status(404).json({ success: false, error: 'Ticket not found' });
      return;
    }

    await query(
      `UPDATE system_tickets SET status = 'PROCESSED' WHERE id = ?`,
      [id.toString()]
    );

    res.json(ok({ id: String(id), status: 'PROCESSED' }));
  })
);

export default router;
