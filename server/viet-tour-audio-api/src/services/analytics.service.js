import { prisma } from '../config/prisma.js';

export async function trackEvent(payload) {
  return prisma.analytic.create({
    data: {
      zoneId: payload.zoneId ? Number(payload.zoneId) : null,
      shopId: payload.shopId ? Number(payload.shopId) : null,
      tourId: payload.tourId ? Number(payload.tourId) : null,
      sessionId: payload.sessionId,
      guestId: payload.guestId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      actionType: payload.actionType,
      dwellTimeSeconds: payload.dwellTimeSeconds,
      language: payload.language,
      metadata: payload.metadata
    }
  });
}

export async function getDashboard() {
  const [totalZones, totalNarrations, totalQRScans, topListenedZones, topFavoriteZones] = await Promise.all([
    prisma.zone.count({ where: { isActive: true } }),
    prisma.narration.count(),
    prisma.analytic.count({ where: { actionType: 'QRScan' } }),
    prisma.analytic.groupBy({ by: ['zoneId'], where: { actionType: 'PlayNarration', zoneId: { not: null } }, _count: { zoneId: true }, orderBy: { _count: { zoneId: 'desc' } }, take: 5 }),
    prisma.guestFavorite.groupBy({ by: ['zoneId'], _count: { zoneId: true }, orderBy: { _count: { zoneId: 'desc' } }, take: 5 })
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessions = await prisma.analytic.findMany({ where: { createdAt: { gte: today } }, distinct: ['sessionId'], select: { sessionId: true } });

  return {
    totalZones,
    totalNarrations,
    todayActiveUsers: sessions.length,
    totalQRScans,
    weeklyListens: [],
    zoneTypeDistribution: [],
    topListenedZones,
    topFavoriteZones
  };
}
