import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ContentController } from '../controllers/content.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();
const controller = new ContentController();

const moderationRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR];

router.use(authenticate, authorize(...moderationRoles));

router.get(
  '/queue',
  asyncHandler(controller.getQueue)
);

router.post(
  '/:id/approve',
  asyncHandler(controller.approveMedia)
);

router.post(
  '/:id/reject',
  asyncHandler(controller.rejectMedia)
);

router.post(
  '/:id/hide',
  asyncHandler(controller.hideMedia)
);

router.patch(
  '/bulk-approve',
  asyncHandler(controller.bulkApprove)
);

export default router;

