import { prisma } from '../config/prisma.js';
import { haversineDistanceMeters, makeBoundingBox } from '../utils/distance.js';

const cooldownStore = new Map();
const COOLDOWN_MS = 10 * 60 * 1000;

export async function checkGeofence({ sessionId, lat, lng, accuracy, lang, tourId, guestId }) {
  const accuracyValue = Number(accuracy ?? 0);
  const bbox = makeBoundingBox(Number(lat), Number(lng), 300);

  const where = {
    isActive: true,
    latitude: { gte: bbox.minLat, lte: bbox.maxLat },
    longitude: { gte: bbox.minLng, lte: bbox.maxLng },
    ...(tourId ? { tourZones: { some: { tourId: Number(tourId) } } } : {})
  };

  const candidates = await prisma.zone.findMany({
    where,
    include: {
      translations: true,
      narrations: true,
      shop: { include: { hours: true } }
    },
    take: 50
  });

  let nearest = null;
  for (const zone of candidates) {
    const distance = haversineDistanceMeters(Number(lat), Number(lng), Number(zone.latitude), Number(zone.longitude));
    const effectiveRadius = zone.radius + Math.max(0, accuracyValue - 10);
    const inside = distance <= effectiveRadius;
    if (!nearest || distance < nearest.distanceMeters) {
      nearest = { zone, distanceMeters: Math.round(distance), effectiveRadius, inside };
    }
  }

  if (!nearest) return { nearest: null, inside: false, narration: null, cooldown: false, remainingMs: 0 };

  const language = (lang || 'vi').slice(0, 5);
  const key = `${sessionId}:${nearest.zone.id}:${language}`;
  const now = Date.now();
  const last = cooldownStore.get(key) ?? 0;
  const remainingMs = Math.max(0, COOLDOWN_MS - (now - last));
  const cooldown = remainingMs > 0;

  let narration = null;
  if (nearest.inside && !cooldown) {
    cooldownStore.set(key, now);
    narration = nearest.zone.narrations.find((x) => x.language === language && x.approvalStatus === 'APPROVED' && x.audioStatus === 'READY')
      || nearest.zone.narrations.find((x) => x.language === 'vi' && x.approvalStatus === 'APPROVED' && x.audioStatus === 'READY')
      || null;
  }

  return {
    nearest: {
      id: nearest.zone.id,
      name: nearest.zone.name,
      isPremium: nearest.zone.isPremium,
      distanceMeters: nearest.distanceMeters,
      effectiveRadius: nearest.effectiveRadius,
      shopHours: nearest.zone.shop?.hours ?? []
    },
    inside: nearest.inside,
    narration,
    cooldown,
    remainingMs
  };
}
