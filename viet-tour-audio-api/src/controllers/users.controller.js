import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { parsePagination } from '../utils/pagination.js';
import { writeAuditLog } from '../services/audit.service.js';

export async function listUsers(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {
    ...(req.query.role ? { role: String(req.query.role) } : {}),
    ...(req.query.status ? { approvalStatus: String(req.query.status) } : {})
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { shop: true } }),
    prisma.user.count({ where })
  ]);

  return res.json({ page, limit, total, items: items.map(({ passwordHash, ...x }) => x) });
}

export async function pendingVendors(req, res) {
  const items = await prisma.user.findMany({ where: { role: 'VENDOR', approvalStatus: 'PENDING' }, include: { shop: true } });
  return res.json({ items });
}

export async function approveVendor(req, res) {
  const id = Number(req.params.id);
  const user = await prisma.user.update({ where: { id }, data: { isActive: true, approvalStatus: 'APPROVED' } });
  await writeAuditLog({ actorUserId: req.user.id, action: 'vendor.approve', entityType: 'User', entityId: id, afterData: user });
  return res.json({ success: true });
}

export async function rejectVendor(req, res) {
  const id = Number(req.params.id);
  const { reason } = z.object({ reason: z.string().min(3).max(500) }).parse(req.body);
  const user = await prisma.user.update({ where: { id }, data: { isActive: false, approvalStatus: 'REJECTED' } });
  await writeAuditLog({ actorUserId: req.user.id, action: 'vendor.reject', entityType: 'User', entityId: id, reason, afterData: user });
  return res.json({ success: true });
}

export async function lockUser(req, res) {
  const id = Number(req.params.id);
  const { lock, reason } = z.object({ lock: z.boolean(), reason: z.string().optional() }).parse(req.body);
  const user = await prisma.user.update({ where: { id }, data: { isActive: !lock } });
  await writeAuditLog({ actorUserId: req.user.id, action: lock ? 'user.lock' : 'user.unlock', entityType: 'User', entityId: id, reason, afterData: user });
  return res.json({ success: true });
}

export async function createAdmin(req, res) {
  const payload = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(8),
    role: z.enum(['ADMIN', 'MODERATOR', 'FINANCE']),
    fullName: z.string().optional(),
    email: z.string().email().optional()
  }).parse(req.body);

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      username: payload.username,
      passwordHash,
      role: payload.role,
      fullName: payload.fullName,
      email: payload.email,
      isActive: true,
      approvalStatus: 'APPROVED'
    }
  });

  await writeAuditLog({ actorUserId: req.user.id, action: 'admin.create', entityType: 'User', entityId: user.id, afterData: { username: user.username, role: user.role } });
  const { passwordHash: omit, ...safe } = user;
  return res.status(201).json(safe);
}
