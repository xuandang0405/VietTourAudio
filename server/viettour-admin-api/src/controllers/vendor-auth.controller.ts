import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2/promise';
import { query } from '../lib/db';
import { UserRole } from '../types/domain';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
const VENDOR_REFRESH_SECRET: Secret = process.env.VENDOR_REFRESH_SECRET || `${String(JWT_SECRET)}:vendor-refresh`;
const VENDOR_REFRESH_EXPIRES_IN = (process.env.VENDOR_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

interface VendorPortalUserRow extends RowDataPacket {
  id: number | string | bigint;
  vendor_id: number | string | bigint;
  email: string;
  pass_hash: string;
  full_name: string;
  status: string;
  vendor_name: string;
  vendor_status: string;
}

function signVendorToken(user: VendorPortalUserRow) {
  const id = String(user.id);
  const vendorId = String(user.vendor_id);
  return jwt.sign(
    { id, userId: id, vendorId, email: user.email, role: UserRole.VENDOR, tokenType: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function signVendorRefreshToken(user: VendorPortalUserRow) {
  const id = String(user.id);
  const vendorId = String(user.vendor_id);
  return jwt.sign(
    { id, userId: id, vendorId, email: user.email, role: UserRole.VENDOR, tokenType: 'refresh' },
    VENDOR_REFRESH_SECRET,
    { expiresIn: VENDOR_REFRESH_EXPIRES_IN }
  );
}

function toVendorSession(user: VendorPortalUserRow) {
  const token = signVendorToken(user);

  return {
    token,
    accessToken: token,
    refreshToken: signVendorRefreshToken(user),
    user: {
      id: String(user.id),
      email: user.email,
      role: UserRole.VENDOR,
      displayName: user.full_name,
      vendorId: String(user.vendor_id),
      vendorName: user.vendor_name,
      vendorStatus: user.vendor_status
    }
  };
}

async function findVendorUserByEmail(email: string) {
  const rows = await query<VendorPortalUserRow[]>(
    `SELECT
       vpu.*,
       v.trade_name AS vendor_name,
       v.status AS vendor_status
     FROM vendor_portal_users vpu
     JOIN vendors v ON v.id = vpu.vendor_id
     WHERE vpu.email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0];
}

async function findVendorUserByCode(vendorCode: string) {
  const rows = await query<VendorPortalUserRow[]>(
    `SELECT
       vpu.*,
       v.trade_name AS vendor_name,
       v.status AS vendor_status
     FROM vendor_portal_users vpu
     JOIN vendors v ON v.id = vpu.vendor_id
     WHERE v.vendor_code = ?
     LIMIT 1`,
    [vendorCode]
  );

  return rows[0];
}

async function findVendorUserById(id: string) {
  const rows = await query<VendorPortalUserRow[]>(
    `SELECT
       vpu.*,
       v.trade_name AS vendor_name,
       v.status AS vendor_status
     FROM vendor_portal_users vpu
     JOIN vendors v ON v.id = vpu.vendor_id
     WHERE vpu.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0];
}

function ensureVendorAccessible(user: any, res: Response) {
  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid credentials', code: 'VENDOR_AUTH_INVALID' });
    return false;
  }

  if (user.vendor_status === 'PENDING') {
    res.status(403).json({ success: false, error: 'Vendor account is pending approval', code: 'VENDOR_PENDING' });
    return false;
  }

  if (user.vendor_status === 'SUSPENDED' || user.vendor_status === 'REJECTED' || user.status !== 'ACTIVE') {
    res.status(403).json({ success: false, error: 'Vendor account is suspended or banned', code: 'VENDOR_BANNED' });
    return false;
  }

  return true;
}

export const vendorLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required', code: 'VENDOR_AUTH_REQUIRED' });
    return;
  }

  try {
    const rows = await query<any[]>(
      `SELECT
         vpu.id,
         vpu.vendor_id,
         vpu.email,
         vpu.pass_hash AS password,
         vpu.full_name,
         vpu.status,
         v.trade_name AS vendor_name,
         v.status AS vendor_status
       FROM vendor_portal_users vpu
       JOIN vendors v ON v.id = vpu.vendor_id
       WHERE vpu.email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );
    const vendor = rows[0];

    if (!vendor) {
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'VENDOR_AUTH_INVALID' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, vendor.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'VENDOR_AUTH_INVALID' });
      return;
    }

    if (!ensureVendorAccessible(vendor, res)) {
      return;
    }

    await query('UPDATE vendor_portal_users SET last_login_at = NOW() WHERE id = ?', [String(vendor.id)]);
    res.json({ success: true, data: toVendorSession(vendor) });
  } catch (error) {
    console.error('Vendor login failed:', error);
    res.status(500).json({ success: false, error: 'Vendor login failed', code: 'VENDOR_AUTH_FAILED' });
  }
};

export const vendorRefresh = async (req: Request, res: Response) => {
  const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : '';

  if (!refreshToken) {
    res.status(400).json({ success: false, error: 'Refresh token required', code: 'VENDOR_REFRESH_REQUIRED' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, VENDOR_REFRESH_SECRET) as any;

    if (payload.role !== UserRole.VENDOR || payload.tokenType !== 'refresh') {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token', code: 'VENDOR_REFRESH_INVALID' });
      return;
    }

    const user = await findVendorUserById(String(payload.userId ?? payload.id));

    if (!ensureVendorAccessible(user, res)) {
      return;
    }

    res.json({ success: true, data: toVendorSession(user) });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token', code: 'VENDOR_REFRESH_INVALID' });
  }
};

export const vendorMe = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== UserRole.VENDOR) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const user = await findVendorUserById(req.user.userId.toString());

  if (!user) {
    res.status(404).json({ success: false, error: 'Vendor user not found' });
    return;
  }

  if (!ensureVendorAccessible(user, res)) {
    return;
  }

  res.json({ success: true, data: toVendorSession(user).user });
};

export const vendorLogout = async (_req: Request, res: Response) => {
  res.json({ success: true, data: true });
};
