import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { GeofenceController } from '../controllers/geofence.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();
const controller = new GeofenceController();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get(
  '/all',
  asyncHandler(controller.all)
);

router.get(
  '/all-data',
  asyncHandler(controller.allData)
);

router.post(
  '/check-overlap',
  asyncHandler(controller.checkOverlap)
);

export default router;

