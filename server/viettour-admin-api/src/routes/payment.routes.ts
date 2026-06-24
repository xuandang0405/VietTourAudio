import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();
const controller = new PaymentController();

// ──────────────────────────────────────────────
// GET /premium-qr — Public, no auth
// Return the Admin-configured Premium payment QR value
// ──────────────────────────────────────────────
router.get(
  '/premium-qr',
  asyncHandler(controller.getPremiumQr)
);

export default router;

