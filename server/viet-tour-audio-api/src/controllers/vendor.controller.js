import { z } from 'zod';
import { prisma } from '../config/prisma.js';

const updateShopSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  imageUrl: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional()
});

export async function getMyShop(req, res) {
  if (!req.user.shopId) return res.status(404).json({ error: 'No shop assigned' });
  const item = await prisma.shop.findUnique({ where: { id: req.user.shopId }, include: { hours: true } });
  return res.json(item);
}

export async function updateMyShop(req, res) {
  if (!req.user.shopId) return res.status(404).json({ error: 'No shop assigned' });
  const payload = updateShopSchema.parse(req.body);

  const hasLocationChange = payload.latitude !== undefined || payload.longitude !== undefined;
  const item = await prisma.shop.update({
    where: { id: req.user.shopId },
    data: {
      ...payload,
      ...(hasLocationChange ? { approvalStatus: 'PENDING' } : {})
    }
  });
  return res.json(item);
}

export async function updateHours(req, res) {
  if (!req.user.shopId) return res.status(404).json({ error: 'No shop assigned' });
  const payload = z.object({
    hours: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), openTime: z.string().optional(), closeTime: z.string().optional(), isClosed: z.boolean().default(false) }))
  }).parse(req.body);

  await prisma.shopHour.deleteMany({ where: { shopId: req.user.shopId } });
  await prisma.shopHour.createMany({ data: payload.hours.map((h) => ({ ...h, shopId: req.user.shopId })) });

  const item = await prisma.shop.findUnique({ where: { id: req.user.shopId }, include: { hours: true } });
  return res.json(item);
}

export async function toggleStatus(req, res) {
  if (!req.user.shopId) return res.status(404).json({ error: 'No shop assigned' });
  const { openStatus } = z.object({ openStatus: z.boolean() }).parse(req.body);
  const item = await prisma.shop.update({ where: { id: req.user.shopId }, data: { openStatus } });
  req.io?.emit('shop:status-changed', { shopId: req.user.shopId, openStatus });
  return res.json(item);
}

export async function myAnalytics(req, res) {
  if (!req.user.shopId) return res.status(404).json({ error: 'No shop assigned' });
  const [visitors, scans, plays, favorites] = await Promise.all([
    prisma.analytic.count({ where: { shopId: req.user.shopId, actionType: 'EnterZone' } }),
    prisma.analytic.count({ where: { shopId: req.user.shopId, actionType: 'QRScan' } }),
    prisma.analytic.count({ where: { shopId: req.user.shopId, actionType: 'PlayNarration' } }),
    prisma.guestFavorite.count({ where: { zone: { shopId: req.user.shopId } } })
  ]);
  return res.json({ visitors, scans, plays, favorites });
}

export async function mySubscription(req, res) {
  if (!req.user.shopId) return res.status(404).json({ error: 'No shop assigned' });
  const subscription = await prisma.vendorSubscription.findFirst({
    where: { shopId: req.user.shopId },
    include: { plan: true },
    orderBy: { periodEnd: 'desc' }
  });
  return res.json({ subscription });
}
