import { Router } from 'express';
import { auth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createTour, deleteTour, getTour, listTours, updateTour } from '../controllers/tours.controller.js';

const router = Router();

router.get('/', asyncHandler(listTours));
router.get('/:id', asyncHandler(getTour));
router.post('/', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(createTour));
router.put('/:id', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(updateTour));
router.delete('/:id', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(deleteTour));

export default router;
