import { Request, Response } from 'express';
import { StallService } from '../services/stall.service';
import { ok } from '../types/api.types';
import { toBigIntId } from '../utils/serialization';

export class StallController {
  private stallService = new StallService();

  resetStallQr = async (req: Request, res: Response): Promise<void> => {
    // [UC38] Scan QR Code
    const id = toBigIntId(req.params.id, 'stall id');
    try {
      const newCode = await this.stallService.resetStallQr(id, req);
      res.json(ok({ zoneCode: newCode }));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };
}
