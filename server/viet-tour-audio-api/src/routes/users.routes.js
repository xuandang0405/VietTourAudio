import { Router } from 'express';
import { auth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { approveVendor, createAdmin, listUsers, lockUser, pendingVendors, rejectVendor } from '../controllers/users.controller.js';

const router = Router();

router.use(auth(true), requireRoles('ADMIN', 'MODERATOR', 'FINANCE'));
router.get('/', asyncHandler(listUsers));
router.get('/pending-vendors', asyncHandler(pendingVendors));
router.post('/:id/approve', asyncHandler(approveVendor));
router.post('/:id/reject', asyncHandler(rejectVendor));
router.post('/:id/lock', asyncHandler(lockUser));
router.post('/admin', asyncHandler(createAdmin));

export default router;
