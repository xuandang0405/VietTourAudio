import { Router } from 'express';
import { auth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createZone, deleteZone, getZoneById, getZonesByTour, listZones, lockZone, updateZone } from '../controllers/zones.controller.js';

const router = Router();

router.get('/', asyncHandler(listZones));
router.get('/by-tour/:tourId', asyncHandler(getZonesByTour));
router.get('/:id', asyncHandler(getZoneById));
router.post('/', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(createZone));
router.put('/:id', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(updateZone));
router.delete('/:id', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(deleteZone));
router.post('/:id/lock', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(lockZone));

export default router;
