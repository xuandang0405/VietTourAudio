import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { createMockPayment, markPaymentPaid } from '../services/payment.service.js';

export async function createMock(req, res) {
  const payload = z.object({
    guestId: z.string().optional(),
    sessionId: z.string().optional(),
    shopId: z.coerce.number().optional(),
    tourId: z.coerce.number().optional(),
    paymentType: z.string().min(3),
    amount: z.coerce.number().positive(),
    currency: z.string().optional()
  }).parse(req.body);

  const item = await createMockPayment(payload);
  return res.status(201).json(item);
}

export async function payMock(req, res) {
  const id = Number(req.params.id);
  const item = await markPaymentPaid(id);
  return res.json(item);
}

export async function paymentStatus(req, res) {
  const id = Number(req.params.id);
  const item = await prisma.payment.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ error: 'Payment not found' });
  return res.json(item);
}

export async function adminList(req, res) {
  const items = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return res.json({ items });
}
