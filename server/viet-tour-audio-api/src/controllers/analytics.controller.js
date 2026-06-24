import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { getDashboard, trackEvent } from '../services/analytics.service.js';

const trackSchema = z.object({
  zoneId: z.coerce.number().optional(),
  shopId: z.coerce.number().optional(),
  tourId: z.coerce.number().optional(),
  sessionId: z.string().min(3),
  guestId: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  actionType: z.enum(['QRScan', 'EnterZone', 'ExitZone', 'PlayNarration', 'Favorite', 'Payment', 'GPSWeak']),
  dwellTimeSeconds: z.coerce.number().optional(),
  language: z.string().optional(),
  metadata: z.any().optional()
});

export async function track(req, res) {
  const payload = trackSchema.parse(req.body);
  const item = await trackEvent(payload);
  req.io?.emit('analytics:new-event', {
    actionType: item.actionType,
    zoneId: item.zoneId,
    shopId: item.shopId,
    createdAt: item.createdAt
  });
  return res.status(201).json(item);
}

export async function dashboard(req, res) {
  const data = await getDashboard();
  return res.json(data);
}

export async function heatmap(req, res) {
  const rows = await prisma.analytic.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    select: { latitude: true, longitude: true, actionType: true },
    orderBy: { createdAt: 'desc' },
    take: 500
  });
  const points = rows.map((r) => [Number(r.latitude), Number(r.longitude), r.actionType === 'PlayNarration' ? 3 : 1]);
  return res.json({ points });
}

export async function activity(req, res) {
  const action = req.query.action ? String(req.query.action) : undefined;
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;

  const items = await prisma.analytic.findMany({
    where: {
      ...(action ? { actionType: action } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {})
    },
    orderBy: { createdAt: 'desc' },
    take: 200
  });
  return res.json({ items });
}

export async function poiTrends(req, res) {
  const listened = await prisma.analytic.groupBy({ by: ['zoneId'], where: { actionType: 'PlayNarration', zoneId: { not: null } }, _count: { zoneId: true }, orderBy: { _count: { zoneId: 'desc' } }, take: 10 });
  const favorite = await prisma.guestFavorite.groupBy({ by: ['zoneId'], _count: { zoneId: true }, orderBy: { _count: { zoneId: 'desc' } }, take: 10 });
  return res.json({ listened, favorite });
}

export async function vendorAnalytics(req, res) {
  const shopId = Number(req.params.shopId || req.user?.shopId);
  if (!shopId) return res.status(400).json({ error: 'shopId is required' });
  if (req.user.role === 'VENDOR' && req.user.shopId !== shopId) return res.status(403).json({ error: 'Forbidden' });

  const [visits, qrScans, plays, favorites] = await Promise.all([
    prisma.analytic.count({ where: { shopId, actionType: 'EnterZone' } }),
    prisma.analytic.count({ where: { shopId, actionType: 'QRScan' } }),
    prisma.analytic.count({ where: { shopId, actionType: 'PlayNarration' } }),
    prisma.guestFavorite.count({ where: { zone: { shopId } } })
  ]);

  return res.json({ shopId, visits, qrScans, plays, favorites });
}
