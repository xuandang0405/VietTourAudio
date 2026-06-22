import { Router } from 'express';
import { auth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { approveNarration, createNarration, getByZone, listPending, rejectNarration, updateNarration } from '../controllers/narrations.controller.js';

const router = Router();

router.get('/zone/:zoneId', asyncHandler(getByZone));
router.post('/', auth(true), requireRoles('ADMIN', 'VENDOR', 'MODERATOR'), asyncHandler(createNarration));
router.put('/:id', auth(true), requireRoles('ADMIN', 'VENDOR', 'MODERATOR'), asyncHandler(updateNarration));
router.post('/:id/approve', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(approveNarration));
router.post('/:id/reject', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(rejectNarration));
router.get('/pending', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(listPending));

export default router;
