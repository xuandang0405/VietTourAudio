// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types/domain';

export interface AuthPayload {
  userId: bigint;
  role: UserRole;
  email: string;
  vendorId?: bigint;
  assignedZoneId?: bigint;
}

// Verify JWT và gán req.user
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = {
      userId: BigInt(payload.userId ?? payload.id),
      role: payload.role,
      email: payload.email,
      vendorId: payload.vendorId == null ? undefined : BigInt(payload.vendorId),
      assignedZoneId: payload.assignedZoneId == null ? undefined : BigInt(payload.assignedZoneId)
    };
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
    return;
  }
};

// Giới hạn theo role
export const authorize = (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden — insufficient role' });
      return;
    }
    next();
  };
