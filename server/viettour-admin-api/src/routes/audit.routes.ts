import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuditController } from '../controllers/audit.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();
const controller = new AuditController();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get(
  '/',
  asyncHandler(controller.getAuditLogs)
);

export default router;

