import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/domain';
import { StallController } from '../controllers/stall.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { query } from '../lib/db';
import { ok } from '../types/api.types';

export const router = Router();
const controller = new StallController();

const adminManagers = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate, authorize(...adminManagers));

router.post(
  '/',
  asyncHandler(controller.createStall)
);

router.put(
  '/:id/qr/reset',
  asyncHandler(controller.resetStallQr)
);

router.put(
  '/:id/premium',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isPremium } = req.body;

    if (typeof isPremium !== 'boolean') {
      return res.status(400).json({ error: 'isPremium must be a boolean' });
    }

    await query(
      'UPDATE stalls SET is_premium = ?, updated_at = NOW() WHERE id = ?',
      [isPremium ? 1 : 0, id]
    );

    res.json(ok({ success: true, isPremium }));
  })
);

export default router;

