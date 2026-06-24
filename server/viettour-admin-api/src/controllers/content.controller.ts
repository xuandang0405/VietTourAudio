import { Request, Response } from 'express';
import { ContentService } from '../services/content.service';
import { ok } from '../types/api.types';
import { optionalReason, requireReason, toBigIntId } from '../utils/serialization';

export class ContentController {
  private contentService = new ContentService();

  getQueue = async (req: Request, res: Response): Promise<void> => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'PENDING';
    const queue = await this.contentService.getMediaQueue(status);
    res.json(ok(queue));
  };

  approveMedia = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'media id');
    const actorId = req.user!.userId;

    try {
      const { item, result } = await this.contentService.approveMedia(id, actorId);

      req.auditMeta = {
        action: 'APPROVE_CONTENT',
        targetType: 'media_files',
        targetId: id,
        beforeData: item,
        afterData: result,
      };

      res.json(ok(result));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  rejectMedia = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'media id');
    const reason = optionalReason(req.body.reason);
    const actorId = req.user!.userId;

    try {
      const { item, result } = await this.contentService.rejectMedia(id, reason, actorId);

      req.auditMeta = {
        action: 'REJECT_CONTENT',
        targetType: 'media_files',
        targetId: id,
        reason,
        beforeData: item,
        afterData: result,
      };

      res.json(ok(result));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  hideMedia = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'media id');
    const reason = requireReason(req.body.reason);
    const actorId = req.user!.userId;

    try {
      const { item, result } = await this.contentService.hideMedia(id, reason, actorId);

      req.auditMeta = {
        action: 'HIDE_CONTENT',
        targetType: 'media_files',
        targetId: id,
        reason,
        beforeData: item,
        afterData: result,
      };

      res.json(ok(result));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  bulkApprove = async (req: Request, res: Response): Promise<void> => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map((id: string) => String(id)) : [];
    const actorId = req.user!.userId;

    if (!ids.length) {
      res.status(400).json({ success: false, error: 'ids are required' });
      return;
    }

    try {
      const count = await this.contentService.bulkApprove(ids, actorId);

      req.auditMeta = {
        action: 'BULK_APPROVE_CONTENT',
        targetType: 'media_files',
        afterData: { ids, count },
      };

      res.json(ok({ count }));
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
