import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { VendorController } from '../controllers/vendor.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();
const controller = new VendorController();

const vendorManagers = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate);

router.get(
  '/',
  authorize(...vendorManagers),
  asyncHandler(controller.getVendors)
);

router.get(
  '/tours-list',
  authorize(...vendorManagers),
  asyncHandler(controller.getToursList)
);

router.post(
  '/',
  authorize(...vendorManagers),
  asyncHandler(controller.createVendor)
);

router.get(
  '/:id',
  authorize(...vendorManagers),
  asyncHandler(controller.getVendorDetail)
);

router.post(
  '/:id/approve',
  authorize(...vendorManagers),
  asyncHandler(controller.approveVendor)
);

router.post(
  '/:id/reject',
  authorize(...vendorManagers),
  asyncHandler(controller.rejectVendor)
);

router.post(
  '/:id/suspend',
  authorize(...vendorManagers),
  asyncHandler(controller.suspendVendor)
);

router.post(
  '/:id/unsuspend',
  authorize(...vendorManagers),
  asyncHandler(controller.unsuspendVendor)
);

router.post(
  '/:id/force-cancel',
  authorize(UserRole.SUPER_ADMIN),
  asyncHandler(controller.forceCancelVendor)
);

router.put(
  '/:id/status',
  authorize(...vendorManagers),
  asyncHandler(controller.updateVendorStatus)
);

router.put(
  '/:id',
  authorize(...vendorManagers),
  asyncHandler(controller.updateVendor)
);

export default router;

