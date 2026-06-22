import { Router } from 'express';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginAdmin, loginVendor, logout, me, register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', loginRateLimit, asyncHandler(loginVendor));
router.post('/admin/login', loginRateLimit, asyncHandler(loginAdmin));
router.get('/me', auth(true), asyncHandler(me));
router.post('/logout', auth(true), asyncHandler(logout));

export default router;
