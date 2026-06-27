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

router.post(
  '/create-request',
  asyncHandler(controller.createRequest)
);

router.post(
  '/sepay-webhook',
  asyncHandler(controller.sepayWebhook)
);

router.get(
  '/status',
  asyncHandler(controller.getStatus)
);

export default router;

