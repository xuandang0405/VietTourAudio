import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/domain';
import { StallController } from '../controllers/stall.controller';
import { asyncHandler } from '../utils/asyncHandler';

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

export default router;

