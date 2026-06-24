import { Router } from 'express';
import { auth, requireRoles } from '../middleware/auth.js';
import { qrRateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createQr, disableQr, listQr, regenerateQr, scan } from '../controllers/qr.controller.js';

const router = Router();

router.get('/', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(listQr));
router.post('/', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(createQr));
router.post('/:id/disable', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(disableQr));
router.post('/:id/regenerate', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(regenerateQr));
router.get('/scan/:token', qrRateLimit, asyncHandler(scan));

export default router;
