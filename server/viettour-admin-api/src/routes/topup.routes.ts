import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { TopUpController } from '../controllers/topup.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();
const controller = new TopUpController();

const financeRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE];

router.use(authenticate, authorize(...financeRoles));

router.get(
  '/requests',
  asyncHandler(controller.getRequests)
);

router.post(
  '/requests/:id/approve',
  asyncHandler(controller.approveRequest)
);

router.post(
  '/requests/:id/reject',
  asyncHandler(controller.rejectRequest)
);

export default router;

