import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { TourController } from '../controllers/poi.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const tourController = new TourController();

const zoneManagers = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate, authorize(...zoneManagers));

router.get(
  '/',
  asyncHandler(tourController.getAllTours)
);

router.get(
  '/:id',
  asyncHandler(tourController.getTour)
);

router.post(
  '/',
  asyncHandler(tourController.createTour)
);

router.put(
  '/:id',
  asyncHandler(tourController.updateTour)
);

router.delete(
  '/:id',
  asyncHandler(tourController.deleteTour)
);

export default router;
