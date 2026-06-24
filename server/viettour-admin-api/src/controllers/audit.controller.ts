import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { ok } from '../types/api.types';

export class AuditController {
  private auditService = new AuditService();

  getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    // Audit logs tracking
    const logs = await this.auditService.getAuditLogs();
    res.json(ok(logs));
  };
}
