import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApprovalStatus, UserRole } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export async function registerVendor(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 10);

  return prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        name: payload.shopName,
        slug: payload.shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: payload.address,
        phoneNumber: payload.phoneNumber,
        approvalStatus: ApprovalStatus.PENDING
      }
    });

    const user = await tx.user.create({
      data: {
        username: payload.username,
        passwordHash,
        fullName: payload.fullName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        role: UserRole.VENDOR,
        isActive: false,
        approvalStatus: ApprovalStatus.PENDING,
        shopId: shop.id
      },
      select: {
        id: true,
        username: true,
        role: true,
        shopId: true,
        approvalStatus: true
      }
    });

    return user;
  });
}

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export async function login({ username, password, adminOnly = false }) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  if (!user.isActive || user.approvalStatus !== ApprovalStatus.APPROVED) {
    throw Object.assign(new Error('Account is not active/approved'), { statusCode: 403 });
  }

  if (adminOnly && !['ADMIN', 'MODERATOR', 'FINANCE'].includes(user.role)) {
    throw Object.assign(new Error('Admin role required'), { statusCode: 403 });
  }

  const token = issueToken(user);
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      shopId: user.shopId
    }
  };
}
