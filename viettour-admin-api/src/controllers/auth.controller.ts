import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2/promise';
import { query } from '../lib/db';
import { UserRole } from '../types/domain';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
const adminRoles = new Set([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR, UserRole.FINANCE]);

interface UserRow extends RowDataPacket {
  id: number | string | bigint;
  email: string;
  role: string;
  status?: string;
  pass_hash?: string;
  password_hash?: string;
  display_name?: string | null;
  full_name?: string | null;
}

function getPasswordHash(user: UserRow) {
  return user.pass_hash ?? user.password_hash ?? '';
}

function getDisplayName(user: UserRow) {
  return user.display_name ?? user.full_name ?? user.email;
}

function signUserToken(user: Pick<UserRow, 'id' | 'email' | 'role'>) {
  const id = String(user.id);
  return jwt.sign({ id, userId: id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export const login = async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required', code: 'AUTH_REQUIRED' });
    return;
  }

  try {
    const users = await query<UserRow[]>('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = users[0];

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'AUTH_INVALID' });
      return;
    }

    if (!adminRoles.has(user.role as UserRole)) {
      res.status(403).json({ success: false, error: 'Use the vendor portal to access this account', code: 'AUTH_WRONG_PORTAL' });
      return;
    }

    if (user.status && user.status !== 'ACTIVE') {
      res.status(403).json({ success: false, error: 'User account is locked or disabled', code: 'AUTH_LOCKED' });
      return;
    }

    const passwordHash = getPasswordHash(user);
    let isValid = false;

    try {
      isValid = await bcrypt.compare(password, passwordHash);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'AUTH_INVALID' });
      return;
    }

    const id = String(user.id);
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
    const token = signUserToken(user);

    res.json({
      success: true,
      data: {
        token,
        accessToken: token,
        refreshToken: token,
        user: {
          id,
          email: user.email,
          role: user.role,
          displayName: getDisplayName(user)
        }
      }
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ success: false, error: 'Login failed', code: 'AUTH_LOGIN_FAILED' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : '';

  if (!refreshToken) {
    res.status(400).json({ success: false, error: 'Refresh token required', code: 'AUTH_REFRESH_REQUIRED' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET) as any;
    const users = await query<UserRow[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [payload.userId ?? payload.id]);
    const user = users[0];

    if (!user || !adminRoles.has(user.role as UserRole) || (user.status && user.status !== 'ACTIVE')) {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token', code: 'AUTH_REFRESH_INVALID' });
      return;
    }

    const token = signUserToken(user);
    res.json({ success: true, data: { accessToken: token, refreshToken: token, user: {
      id: String(user.id),
      email: user.email,
      role: user.role,
      displayName: getDisplayName(user)
    } } });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token', code: 'AUTH_REFRESH_INVALID' });
  }
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (!adminRoles.has(req.user.role)) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }

  const users = await query<UserRow[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.userId.toString()]);
  const user = users[0];

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: String(user.id),
      email: user.email,
      role: user.role,
      displayName: getDisplayName(user),
      status: user.status
    }
  });
};

export const logout = async (_req: Request, res: Response) => {
  res.json({ success: true, data: true });
};
