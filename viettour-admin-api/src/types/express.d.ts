import { AuthPayload } from '../middleware/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      auditMeta?: {
        action: string;
        targetType: string;
        targetId?: bigint;
        targetLabel?: string;
        reason?: string;
        beforeData?: object | null;
        afterData?: object | null;
      };
    }
  }
}
