import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Capture original send
  const originalSend = res.send;
  res.send = function (body: any): Response {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.auditMeta && req.user) {
      const meta = req.auditMeta;
      prisma.auditLog.create({
        data: {
          performedById: req.user.userId,
          action: meta.action,
          targetType: meta.targetType,
          targetId: meta.targetId,
          targetLabel: meta.targetLabel,
          reason: meta.reason,
          beforeData: meta.beforeData as any,
          afterData: meta.afterData as any,
          ipAddress: req.ip
        }
      }).catch(err => console.error('Audit Log Error:', err));
    }
    return originalSend.call(this, body);
  };
  next();
};
