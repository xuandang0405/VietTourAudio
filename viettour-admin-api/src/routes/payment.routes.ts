import { Router } from 'express';
import { query } from '../lib/db';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();

// ──────────────────────────────────────────────
// GET /premium-qr — Public, no auth
// Return the Admin-configured Premium payment QR value
// ──────────────────────────────────────────────
router.get(
  '/premium-qr',
  asyncHandler(async (_req, res) => {
    const rows = await query<any[]>(
      `SELECT \`value\` FROM app_settings WHERE \`key\` = ? LIMIT 1`,
      ['PREMIUM_PAYMENT_QR']
    );

    const qrValue = rows.length > 0 ? rows[0].value : null;

    res.json(
      ok({
        qrValue: qrValue ?? 'MOMO-PAY-PREMIUM-12345',
        bankAccount: '190382910283 (Techcombank)',
        transferContent: 'VTA PREMIUM',
        amount: 30000,
        currency: 'VND',
        message: 'Quét mã để thanh toán. Cú pháp: [Số điện thoại của bạn]'
      })
    );
  })
);

export default router;
