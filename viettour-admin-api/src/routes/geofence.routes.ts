import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';
import { serializeForJson } from '../utils/serialization';

export const router = Router();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

router.get(
  '/all',
  asyncHandler(async (_req, res) => {
    const stalls = await prisma.stall.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      include: { vendor: true, pois: true },
      orderBy: { updatedAt: 'desc' }
    });

    const withOverlap = stalls.map((stall) => {
      const overlaps = stalls
        .filter((candidate) => candidate.id !== stall.id)
        .filter((candidate) => {
          if (stall.latitude == null || stall.longitude == null || candidate.latitude == null || candidate.longitude == null) return false;
          return (
            distanceMeters(
              { latitude: stall.latitude, longitude: stall.longitude },
              { latitude: candidate.latitude, longitude: candidate.longitude }
            ) <
            stall.activationRadius + candidate.activationRadius
          );
        })
        .map((candidate) => candidate.id);

      return { ...stall, overlaps };
    });

    res.json(ok(serializeForJson(withOverlap)));
  })
);

router.post(
  '/check-overlap',
  asyncHandler(async (req, res) => {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    const radius = Number(req.body.activationRadius ?? req.body.radius ?? 10);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radius) || radius <= 0) {
      res.status(400).json({ success: false, error: 'latitude, longitude and radius are required' });
      return;
    }

    const stalls = await prisma.stall.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      include: { vendor: true }
    });

    const overlaps = stalls
      .filter((stall) => stall.latitude != null && stall.longitude != null)
      .map((stall) => ({
        stall,
        distance: distanceMeters({ latitude, longitude }, { latitude: stall.latitude!, longitude: stall.longitude! })
      }))
      .filter(({ stall, distance }) => distance < radius + stall.activationRadius);

    res.json(ok(serializeForJson({ hasOverlap: overlaps.length > 0, overlaps })));
  })
);

export default router;
