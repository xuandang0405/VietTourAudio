import { Request, Response } from 'express';
import { TopUpService } from '../services/topup.service';
import { ok } from '../types/api.types';
import { requireReason, toBigIntId } from '../utils/serialization';

export class TopUpController {
  private topUpService = new TopUpService();

  getRequests = async (req: Request, res: Response): Promise<void> => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'PENDING';
    const requests = await this.topUpService.getTopUpRequests(status);
    res.json(ok(requests));
  };

  approveRequest = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'top-up request id');
    const userId = req.user!.userId;

    try {
      const { before, after } = await this.topUpService.approveRequest(id, userId);

      req.auditMeta = {
        action: 'APPROVE_TOP_UP',
        targetType: 'top_up_requests',
        targetId: id,
        beforeData: before,
        afterData: after,
      };

      res.json(ok(after));
    } catch (err: any) {
      const code = err.statusCode ?? 500;
      res.status(code).json({ success: false, error: err.message });
    }
  };

  rejectRequest = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'top-up request id');
    const reason = requireReason(req.body.reason);
    const userId = req.user!.userId;

    try {
      const { before, after } = await this.topUpService.rejectRequest(id, reason, userId);

      req.auditMeta = {
        action: 'REJECT_TOP_UP',
        targetType: 'top_up_requests',
        targetId: id,
        reason,
        beforeData: before,
        afterData: after,
      };

      res.json(ok(after));
    } catch (err: any) {
      const code = err.statusCode ?? 500;
      res.status(code).json({ success: false, error: err.message });
    }
  };
}
