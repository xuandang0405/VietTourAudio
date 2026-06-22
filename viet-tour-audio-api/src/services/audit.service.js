import { prisma } from '../config/prisma.js';

export async function writeAuditLog({ actorUserId, action, entityType, entityId, reason, beforeData, afterData }) {
  return prisma.auditLog.create({
    data: {
      actorUserId: actorUserId ?? null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      reason,
      beforeData,
      afterData
    }
  });
}
