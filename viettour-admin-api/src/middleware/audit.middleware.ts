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

      query(
        `INSERT INTO audit_logs
          (actor_user_id, action, target_type, target_id, before_data, after_data, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.userId.toString(),
          meta.action,
          meta.targetType,
          meta.targetId?.toString() ?? null,
          safeJson(meta.beforeData),
          safeJson(meta.afterData),
          req.ip,
          req.get('user-agent') ?? null
        ]
      ).catch((error) => console.error('Audit Log Error:', error));
    }

    return originalSend.call(this, body);
  };

  next();
};
