import { Router } from 'express';
import { auth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getSettings, upsertSetting } from '../controllers/settings.controller.js';

const router = Router();

router.get('/', auth(true), requireRoles('ADMIN', 'MODERATOR', 'FINANCE'), asyncHandler(getSettings));
router.post('/', auth(true), requireRoles('ADMIN', 'MODERATOR', 'FINANCE'), asyncHandler(upsertSetting));

export default router;
