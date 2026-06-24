import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { ok } from '../types/api.types';

export class PaymentController {
  private paymentService = new PaymentService();

  getPremiumQr = async (req: Request, res: Response): Promise<void> => {
    // [UC48] Offline Cache / Sync configuration loading
    const qrData = await this.paymentService.getPremiumQrData();
    res.json(ok(qrData));
  };
}
