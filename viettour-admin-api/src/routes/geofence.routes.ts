import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';
import { buildPoiZoneScope, buildStallZoneScope } from '../utils/zoneScope';

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
  asyncHandler(async (req, res) => {
    const zoneScope = buildStallZoneScope(req);
    const rows = await query<any[]>(
      `SELECT
         s.*,
         v.trade_name, v.contact_email
       FROM stalls s
       JOIN vendors v ON v.id = s.vendor_id
       WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
       ${zoneScope.clause}
       ORDER BY s.updated_at DESC`,
      zoneScope.params
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

router.get(
  '/all-data',
  asyncHandler(async (req, res) => {
    const stallZoneScope = buildStallZoneScope(req);
    const poiZoneScope = buildPoiZoneScope(req);
    // 1. Get stalls
    const stallRows = await query<any[]>(
      `SELECT s.*, v.trade_name, v.contact_email
       FROM stalls s
       JOIN vendors v ON v.id = s.vendor_id
       WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
       ${stallZoneScope.clause}`,
      stallZoneScope.params
    );
    const stalls = stallRows.map(mapStall);
    const stallsWithOverlap = stalls.map((stall) => ({
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

    // 2. Get POIs
    const poiRows = await query<any[]>(
      `SELECT p.*, s.name AS stall_name
       FROM pois p
       LEFT JOIN stalls s ON s.id = p.stall_id
       WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND p.status != 'HIDDEN'
       ${poiZoneScope.clause}`,
      poiZoneScope.params
    );
    const pois = poiRows.map((row) => ({
      id: String(row.id),
      name: row.name,
      stallId: String(row.stall_id),
      stallName: row.stall_name || 'N/A',
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      activationRadius: Number(row.activation_radius),
      status: row.status
    }));

    // 3. Get Tours
    const tourRows = await query<any[]>('SELECT * FROM tours WHERE status != \'ARCHIVED\'');
    const tourPoiRows = await query<any[]>(
      `SELECT tp.tour_id, p.id AS poi_id, p.latitude, p.longitude, p.name AS poi_name
       FROM tour_pois tp
       JOIN pois p ON p.id = tp.poi_id
       WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL`
    );

    const tours = tourRows.map((tour) => {
      const poisInTour = tourPoiRows.filter((tp) => tp.tour_id === tour.id);
      if (poisInTour.length === 0) {
        return {
          id: String(tour.id),
          name: tour.name,
          description: tour.description,
          latitude: 10.77582, // Default to Nguyen Hue
          longitude: 106.70208,
          radius: 150
        };
      }

      const sumLat = poisInTour.reduce((sum, p) => sum + Number(p.latitude), 0);
      const sumLng = poisInTour.reduce((sum, p) => sum + Number(p.longitude), 0);
      const avgLat = sumLat / poisInTour.length;
      const avgLng = sumLng / poisInTour.length;

      let maxDist = 100;
      for (const poi of poisInTour) {
        const dist = distanceMeters(
          { latitude: avgLat, longitude: avgLng },
          { latitude: Number(poi.latitude), longitude: Number(poi.longitude) }
        );
        if (dist > maxDist) maxDist = dist;
      }

      return {
        id: String(tour.id),
        name: tour.name,
        description: tour.description,
        latitude: avgLat,
        longitude: avgLng,
        radius: Math.ceil(maxDist + 50)
      };
    });

    res.json(ok({
      stalls: stallsWithOverlap,
      pois,
      tours
    }));
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

    const zoneScope = buildStallZoneScope(req);
    const rows = await query<any[]>(
      `SELECT s.*, v.trade_name, v.contact_email
       FROM stalls s
       JOIN vendors v ON v.id = s.vendor_id
       WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
       ${zoneScope.clause}`,
      zoneScope.params
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
