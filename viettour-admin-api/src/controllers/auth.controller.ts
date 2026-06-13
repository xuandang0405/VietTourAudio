import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ok, fail } from '../types/api.types';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json(fail('Invalid credentials', 'AUTH_INVALID'));
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json(fail('User account is locked or deleted', 'AUTH_LOCKED'));
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json(fail('Invalid credentials', 'AUTH_INVALID'));
    }

    const accessToken = jwt.sign(
      { userId: user.id.toString(), role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshTokenString).digest('hex');

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    res.json(ok({
      accessToken,
      refreshToken: refreshTokenString,
      user: {
        id: user.id.toString(),
        email: user.email,
        role: user.role,
        displayName: user.displayName
      }
    }));
  } catch (error) {
    res.status(500).json(fail('Login failed'));
  }
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json(fail('Unauthorized'));
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, displayName: true, status: true }
    });
    if (!user) return res.status(404).json(fail('User not found'));
    
    res.json(ok({
      ...user,
      id: user.id.toString()
    }));
  } catch (error) {
    res.status(500).json(fail('Failed to fetch user'));
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json(fail('Refresh token required'));

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      include: { user: true }
    });

    if (!tokenRecord) {
      return res.status(401).json(fail('Invalid or expired refresh token'));
    }

    const accessToken = jwt.sign(
      { userId: tokenRecord.user.id.toString(), role: tokenRecord.user.role, email: tokenRecord.user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Xoay vòng (rotate) refresh token
    const newRefreshTokenString = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRefreshTokenString).digest('hex');

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json(ok({
      accessToken,
      refreshToken: newRefreshTokenString
    }));
  } catch (error) {
    res.status(500).json(fail('Refresh failed'));
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await prisma.refreshToken.deleteMany({
        where: { tokenHash, userId: req.user?.userId }
      });
    }
    res.json(ok(true));
  } catch (error) {
    res.status(500).json(fail('Logout failed'));
  }
};
