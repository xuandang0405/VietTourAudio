import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserController } from '../controllers/user.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();
const controller = new UserController();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.post(
  '/zone-admins',
  asyncHandler(controller.createZoneAdmin)
);

export default router;

