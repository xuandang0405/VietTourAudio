import { Request, Response, NextFunction } from 'express';
import { query } from '../lib/db';

function safeJson(value: unknown) {
  if (value === undefined) return null;
  return JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? item.toString() : item));
}

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function (body: any): Response {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.auditMeta && req.user) {
      const meta = req.auditMeta;

      let beforeData = meta.beforeData;
      let afterData = meta.afterData;

      if (meta.reason) {
        if (beforeData && typeof beforeData === 'object' && !Array.isArray(beforeData)) {
          beforeData = { ...(beforeData as any), reason: meta.reason };
        } else if (beforeData === null || beforeData === undefined) {
          beforeData = { reason: meta.reason };
        }

        if (afterData && typeof afterData === 'object' && !Array.isArray(afterData)) {
          afterData = { ...(afterData as any), reason: meta.reason };
        } else if (afterData === null || afterData === undefined) {
          afterData = { reason: meta.reason };
        }
      }

      query(
        `INSERT INTO audit_logs
          (actor_user_id, action, target_type, target_id, before_data, after_data, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.userId.toString(),
          meta.action,
          meta.targetType,
          meta.targetId?.toString() ?? null,
          safeJson(beforeData),
          safeJson(afterData),
          req.ip,
          req.get('user-agent') ?? null
        ]
      ).catch((error) => console.error('Audit Log Error:', error));
    }

    return originalSend.call(this, body);
  };

  next();
};
