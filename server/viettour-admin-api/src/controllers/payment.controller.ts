import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { ok } from '../types/api.types';
import { query } from '../lib/db';

export class PaymentController {
  private paymentService = new PaymentService();

  getPremiumQr = async (req: Request, res: Response): Promise<void> => {
    const qrData = await this.paymentService.getPremiumQrData();
    res.json(ok(qrData));
  };

  createRequest = async (req: Request, res: Response): Promise<void> => {
    const { guestId, tourId } = req.body;
    if (!guestId || !tourId) {
      res.status(400).json({ success: false, error: 'guestId and tourId are required' });
      return;
    }

    // 1. Fetch tour details (price)
    const tourRows = await query<any[]>(
      'SELECT id, name, price, is_premium FROM tours WHERE id = ? LIMIT 1',
      [tourId]
    );
    if (tourRows.length === 0) {
      res.status(404).json({ success: false, error: 'Tour not found' });
      return;
    }
    const tour = tourRows[0];
    const price = Number(tour.price);

    // 2. Generate unique reference code (max 20 characters)
    // VTAG + last 8 chars of guestId + T + tourId
    const cleanGuestId = String(guestId).replace(/[^a-zA-Z0-9]/g, '');
    const last8 = cleanGuestId.slice(-8);
    const referenceCode = `VTAG${last8}T${tourId}`.toUpperCase();

    // 3. Save pending request
    await query(
      `INSERT INTO payment_requests (guest_id, tour_id, reference_code, status)
       VALUES (?, ?, ?, 'PENDING')
       ON DUPLICATE KEY UPDATE status = 'PENDING', created_at = NOW()`,
      [guestId, tourId, referenceCode]
    );

    // 4. Load bank details
    const settingsRows = await query<any[]>(
      "SELECT `value` FROM app_settings WHERE `key` = 'PREMIUM_PAYMENT_QR' LIMIT 1"
    );
    const settingsVal = settingsRows[0]?.value || '970403:123456789:NHOM_VTA:NGUYEN VAN A';
    const [bankBin, accountNumber, accountName] = settingsVal.split(':');

    const qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.jpg?amount=${price}&addInfo=${referenceCode}&accountName=${encodeURIComponent(accountName)}`;

    res.json(
      ok({
        referenceCode,
        amount: price,
        bankBin,
        accountNumber,
        accountName,
        qrUrl
      })
    );
  };

  sepayWebhook = async (req: Request, res: Response): Promise<void> => {
    // SePay sends webhook containing transaction description/content in 'content' field
    const { content, transferAmount, id } = req.body;
    console.log('Received SePay Webhook:', req.body);

    const transferContent = String(content || req.body.description || '');
    const match = transferContent.match(/VTAG([A-Z0-9]+)T(\d+)/i);

    if (!match) {
      // Not a VietTourAudio transaction, ignore but respond 200
      res.json({ success: false, message: 'Invalid reference pattern' });
      return;
    }

    const referenceCode = match[0].toUpperCase();
    const guestIdSub = match[1];
    const tourId = Number(match[2]);

    // Check if there is a pending payment request
    const requestRows = await query<any[]>(
      'SELECT guest_id, tour_id, status FROM payment_requests WHERE UPPER(reference_code) = ? LIMIT 1',
      [referenceCode]
    );

    if (requestRows.length === 0) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    const request = requestRows[0];

    // Mark as PAID
    await query(
      "UPDATE payment_requests SET status = 'PAID' WHERE UPPER(reference_code) = ?",
      [referenceCode]
    );

    // Unlock the tour for this guest
    const transactionRef = String(id || req.body.transactionId || `sepay-${Date.now()}`);
    await query(
      `INSERT INTO unlocked_tours (guest_id, tour_id, transaction_reference)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE transaction_reference = ?`,
      [request.guest_id, request.tour_id, transactionRef, transactionRef]
    );

    console.log(`Successfully unlocked tour ${request.tour_id} for guest ${request.guest_id}`);

    res.json({ success: true, message: 'Transaction processed and tour unlocked' });
  };

  getStatus = async (req: Request, res: Response): Promise<void> => {
    const reference = String(req.query.reference || '');
    if (!reference) {
      res.status(400).json({ success: false, error: 'reference is required' });
      return;
    }

    const rows = await query<any[]>(
      'SELECT status FROM payment_requests WHERE UPPER(reference_code) = ? LIMIT 1',
      [reference.toUpperCase()]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    res.json(ok({ status: rows[0].status }));
  };
}
