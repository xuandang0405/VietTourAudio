import { prisma } from '../config/prisma.js';

let ioRef = null;

export function attachIo(io) {
  ioRef = io;
}

export async function notifyUser({ recipientUserId, recipientRole, message, shopId }) {
  const notification = await prisma.appNotification.create({
    data: {
      recipientUserId: recipientUserId ?? null,
      recipientRole: recipientRole ?? 'VENDOR',
      message
    }
  });

  if (ioRef) {
    if (shopId) {
      ioRef.to(`vendor:${shopId}`).emit('notification:new', notification);
    }
    if (recipientUserId) {
      ioRef.to(`user:${recipientUserId}`).emit('notification:new', notification);
    }
  }

  return notification;
}
