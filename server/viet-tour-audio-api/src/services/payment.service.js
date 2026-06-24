import { PaymentStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { randomToken } from '../utils/crypto.js';

export async function createMockPayment(payload) {
  return prisma.payment.create({
    data: {
      guestId: payload.guestId,
      sessionId: payload.sessionId,
      shopId: payload.shopId ? Number(payload.shopId) : null,
      tourId: payload.tourId ? Number(payload.tourId) : null,
      paymentType: payload.paymentType,
      provider: 'mock',
      amount: Number(payload.amount),
      currency: payload.currency || 'VND',
      status: PaymentStatus.PENDING,
      transactionRef: `mock-${Date.now()}-${randomToken(4)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
}

export async function markPaymentPaid(id) {
  return prisma.payment.update({
    where: { id: Number(id) },
    data: {
      status: PaymentStatus.PAID,
      paidAt: new Date()
    }
  });
}
