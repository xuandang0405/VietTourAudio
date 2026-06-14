import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

router.get(
  '/all',
  asyncHandler(async (_req, res) => {
    const rows = await query<any[]>(
      `SELECT
         s.*,
         v.trade_name, v.contact_email
       FROM stalls s
       JOIN vendors v ON v.id = s.vendor_id
       WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
       ORDER BY s.updated_at DESC`
    );

    const stalls = rows.map(mapStall);
    const withOverlap = stalls.map((stall) => ({
      ...stall,
      overlaps: stalls
        .filter((candidate) => candidate.id !== stall.id)
        .filter((candidate) => {
          return (
            distanceMeters(
              { latitude: Number(stall.latitude), longitude: Number(stall.longitude) },
              { latitude: Number(candidate.latitude), longitude: Number(candidate.longitude) }
            ) <
            Number(stall.activationRadius) + Number(candidate.activationRadius)
          );
        })
        .map((candidate) => candidate.id)
    }));

    res.json(ok(withOverlap));
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

    const rows = await query<any[]>(
      `SELECT s.*, v.trade_name, v.contact_email
       FROM stalls s
       JOIN vendors v ON v.id = s.vendor_id
       WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL`
    );
    const overlaps = rows
      .map(mapStall)
      .map((stall) => ({
        stall,
        distance: distanceMeters({ latitude, longitude }, { latitude: Number(stall.latitude), longitude: Number(stall.longitude) })
      }))
      .filter(({ stall, distance }) => distance < radius + Number(stall.activationRadius));

    res.json(ok({ hasOverlap: overlaps.length > 0, overlaps }));
  })
);

function mapStall(row: any) {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    name: row.name,
    slug: row.slug,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    activationRadius: Number(row.activation_radius),
    status: row.status === 'APPROVED' ? 'ACTIVE' : row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vendor: {
      id: String(row.vendor_id),
      businessName: row.trade_name,
      ownerEmail: row.contact_email
    }
  };
}

export default router;
