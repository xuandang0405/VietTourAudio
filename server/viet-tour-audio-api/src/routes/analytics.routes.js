import { Router } from 'express';
import { auth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { activity, dashboard, heatmap, poiTrends, track, vendorAnalytics } from '../controllers/analytics.controller.js';

const router = Router();

router.post('/track', asyncHandler(track));
router.get('/dashboard', auth(true), requireRoles('ADMIN', 'MODERATOR', 'FINANCE'), asyncHandler(dashboard));
router.get('/heatmap', auth(true), requireRoles('ADMIN', 'MODERATOR', 'FINANCE'), asyncHandler(heatmap));
router.get('/activity', auth(true), requireRoles('ADMIN', 'MODERATOR', 'FINANCE'), asyncHandler(activity));
router.get('/poi-trends', auth(true), requireRoles('ADMIN', 'MODERATOR', 'FINANCE'), asyncHandler(poiTrends));
router.get('/vendor/:shopId', auth(true), requireRoles('ADMIN', 'MODERATOR', 'FINANCE', 'VENDOR'), asyncHandler(vendorAnalytics));

export default router;
