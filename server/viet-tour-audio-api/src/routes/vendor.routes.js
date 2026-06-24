import { Router } from 'express';
import { auth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getMyShop, myAnalytics, mySubscription, toggleStatus, updateHours, updateMyShop } from '../controllers/vendor.controller.js';

const router = Router();

router.use(auth(true), requireRoles('VENDOR', 'ADMIN', 'MODERATOR'));
router.get('/shop', asyncHandler(getMyShop));
router.put('/shop', asyncHandler(updateMyShop));
router.put('/shop/hours', asyncHandler(updateHours));
router.post('/shop/status', asyncHandler(toggleStatus));
router.get('/analytics', asyncHandler(myAnalytics));
router.get('/subscription', asyncHandler(mySubscription));

export default router;
