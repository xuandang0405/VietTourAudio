import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { check } from '../controllers/geofence.controller.js';

const router = Router();

router.post('/check', asyncHandler(check));

export default router;
