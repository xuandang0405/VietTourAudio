import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PoiController, TourController } from '../controllers/poi.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();
const controller = new PoiController();
const tourController = new TourController();

const poiManagers = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate, authorize(...poiManagers));

// ── POI (Zone) routes ──
router.get(
  '/',
  asyncHandler(controller.getAllPois)
);

router.get(
  '/stalls',
  asyncHandler(controller.getAllStalls)
);

router.get(
  '/zones',
  asyncHandler(controller.getActiveZones)
);

router.get(
  '/distance',
  asyncHandler(controller.getDistance)
);

router.post(
  '/',
  asyncHandler(controller.createPoi)
);

router.put(
  '/:id',
  asyncHandler(controller.updatePoi)
);

router.delete(
  '/:id',
  asyncHandler(controller.deletePoi)
);

// ── Tour (Khu vực) routes ──
router.get(
  '/tours',
  asyncHandler(tourController.getAllTours)
);

router.get(
  '/tours/:id',
  asyncHandler(tourController.getTour)
);

router.post(
  '/tours',
  asyncHandler(tourController.createTour)
);

router.put(
  '/tours/:id',
  asyncHandler(tourController.updateTour)
);

router.delete(
  '/tours/:id',
  asyncHandler(tourController.deleteTour)
);

router.post(
  '/tours/:id/qr/reset',
  asyncHandler(tourController.resetTourQr)
);

export default router;
