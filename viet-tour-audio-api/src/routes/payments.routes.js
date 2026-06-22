import { Router } from 'express';
import { auth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { adminList, createMock, paymentStatus, payMock } from '../controllers/payments.controller.js';

const router = Router();

router.post('/mock/create', asyncHandler(createMock));
router.post('/mock/:id/pay', asyncHandler(payMock));
router.get('/:id/status', asyncHandler(paymentStatus));
router.get('/admin/list', auth(true), requireRoles('ADMIN', 'FINANCE', 'MODERATOR'), asyncHandler(adminList));

export default router;
