import { Request, Router } from 'express';
import geoip from 'geoip-lite';
import { query } from '../lib/db';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();

function getRequestIp(req: Request): string | null {
  const forwardedFor = req.headers['x-forwarded-for'];
  const rawIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor ?? req.ip ?? req.socket.remoteAddress;
  const firstIp = String(rawIp ?? '').split(',')[0]?.trim();

  if (!firstIp) {
    return null;
  }

  return firstIp.replace(/^::ffff:/, '');
}

// ──────────────────────────────────────────────
// GET /resolve-code/:code — Public, no auth
// Resolve a Tour (Khu vực) by QR code, slug, or legacy stall zone_code
// Returns Tour info (as `stall` for backward compat) + its Zones (as `pois`)
// ──────────────────────────────────────────────
router.get(
  '/resolve-code/:code',
  asyncHandler(async (req, res) => {
    const rawCode = req.params.code;
    const code = (typeof rawCode === 'string' ? rawCode : '').trim();

    if (!code || code.length < 2 || code.length > 50) {
      res.status(400).json({ success: false, error: 'Invalid code format' });
      return;
    }

    let tour: any = null;
    let qrCodeId: string | null = null;

    // Strategy 1: Find Tour via QR code table
    const qrRows = await query<any[]>(
      `SELECT qr.id AS qr_id, qr.tour_id, qr.vendor_id,
              t.id AS t_id, t.name, t.slug, t.description, t.status, t.vendor_id AS t_vendor_id
       FROM qr_codes qr
       JOIN tours t ON t.id = qr.tour_id
       WHERE REPLACE(qr.code, '-', '') = REPLACE(?, '-', '') AND qr.qr_type = 'TOUR' AND qr.is_active = 1
       LIMIT 1`,
      [code.toUpperCase()]
    );

    if (qrRows.length > 0) {
      const row = qrRows[0];
      qrCodeId = String(row.qr_id);
      tour = {
        id: row.t_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        status: row.status,
        vendor_id: row.t_vendor_id,
      };
    }

    // Strategy 2: Find Tour by slug (manual code entry)
    if (!tour) {
      const slugRows = await query<any[]>(
        `SELECT t.id, t.name, t.slug, t.description, t.status, t.vendor_id
         FROM tours t
         WHERE t.slug = ? AND t.status = 'PUBLISHED'
         LIMIT 1`,
        [code.toLowerCase()]
      );
      if (slugRows.length > 0) {
        tour = slugRows[0];
      }
    }

    // Strategy 3: Legacy fallback — find stall by zone_code, return its POIs from zones
    if (!tour) {
      const stallRows = await query<any[]>(
        `SELECT
           s.id, s.vendor_id, s.name, s.slug, s.description, s.address,
           s.latitude, s.longitude, s.activation_radius, s.status,
           s.is_featured, s.zone_code, s.opening_hours,
           v.trade_name AS vendor_name
         FROM stalls s
         JOIN vendors v ON v.id = s.vendor_id
         WHERE REPLACE(s.zone_code, '-', '') = REPLACE(?, '-', '')
         LIMIT 1`,
        [code.toUpperCase()]
      );

      if (stallRows.length === 0) {
        res.status(404).json({ success: false, error: 'Code not found' });
        return;
      }

      const stall = stallRows[0];
      const ipAddress = getRequestIp(req);
      const countryCode = ipAddress ? geoip.lookup(ipAddress)?.country ?? null : null;

      await query(
        `INSERT INTO qr_scan_events (vendor_id, stall_id, ip_address, user_agent, country_code, referrer, scanned_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          stall.vendor_id == null ? null : String(stall.vendor_id),
          String(stall.id),
          ipAddress,
          req.get('user-agent') ?? null,
          countryCode,
          req.get('referer') ?? null
        ]
      );

      // Fetch zones belonging to this stall
      const poiRows = await query<any[]>(
        `SELECT
           z.id, z.name, z.slug, z.description, z.latitude, z.longitude,
           z.activation_radius, z.is_premium_content, z.status, z.sort_order,
           (SELECT COUNT(DISTINCT pc.lang) FROM poi_contents pc WHERE pc.poi_id = z.id) AS language_count,
           (SELECT pc.audio_url FROM poi_contents pc WHERE pc.poi_id = z.id AND pc.lang = 'vi' LIMIT 1) AS audio_url_vi
         FROM zones z
         WHERE z.stall_id = ? AND z.status = 'ACTIVE'
         ORDER BY z.sort_order ASC, z.id ASC`,
        [stall.id.toString()]
      );

      res.json(
        ok({
          stall: {
            id: String(stall.id),
            name: stall.name,
            slug: stall.slug,
            description: stall.description,
            address: stall.address,
            latitude: Number(stall.latitude),
            longitude: Number(stall.longitude),
            activationRadius: Number(stall.activation_radius),
            status: stall.status,
            isFeatured: Boolean(stall.is_featured),
            zoneCode: stall.zone_code,
            openingHours: stall.opening_hours,
            vendorName: stall.vendor_name
          },
          pois: poiRows.map((poi) => ({
            id: String(poi.id),
            name: poi.name,
            slug: poi.slug,
            description: poi.description,
            latitude: Number(poi.latitude),
            longitude: Number(poi.longitude),
            isPremiumContent: Boolean(poi.is_premium_content),
            status: poi.status,
            sortOrder: Number(poi.sort_order ?? 0),
            languageCount: Number(poi.language_count ?? 0),
            audioUrlVi: poi.audio_url_vi
          }))
        })
      );
      return;
    }

    // ── Tour found (Strategy 1 or 2) ──
    const ipAddress = getRequestIp(req);
    const countryCode = ipAddress ? geoip.lookup(ipAddress)?.country ?? null : null;

    // Log scan event with tour_id
    await query(
      `INSERT INTO qr_scan_events (qr_code_id, vendor_id, tour_id, ip_address, user_agent, country_code, referrer, scanned_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        qrCodeId,
        tour.vendor_id == null ? null : String(tour.vendor_id),
        String(tour.id),
        ipAddress,
        req.get('user-agent') ?? null,
        countryCode,
        req.get('referer') ?? null
      ]
    );

    // Fetch all zones (POIs) belonging to this tour
    const zoneRows = await query<any[]>(
      `SELECT
         z.id, z.name, z.slug, z.description, z.latitude, z.longitude,
         z.activation_radius, z.is_premium_content, z.status, z.sort_order,
         z.tour_id,
         (SELECT COUNT(DISTINCT pc.lang) FROM poi_contents pc WHERE pc.poi_id = z.id) AS language_count,
         (SELECT pc.audio_url FROM poi_contents pc WHERE pc.poi_id = z.id AND pc.lang = 'vi' LIMIT 1) AS audio_url_vi,
         s.name AS stall_name
       FROM zones z
       LEFT JOIN stalls s ON s.id = z.stall_id
       WHERE z.tour_id = ? AND z.status = 'ACTIVE'
       ORDER BY z.sort_order ASC, z.id ASC`,
      [String(tour.id)]
    );

    // Return Tour info in `stall` field for backward compatibility with client
    res.json(
      ok({
        stall: {
          id: String(tour.id),
          name: tour.name,
          slug: tour.slug,
          description: tour.description,
          address: null,
          latitude: zoneRows.length > 0 ? Number(zoneRows[0].latitude) : 0,
          longitude: zoneRows.length > 0 ? Number(zoneRows[0].longitude) : 0,
          activationRadius: 100,
          status: tour.status,
          isFeatured: true,
          zoneCode: tour.slug,
          openingHours: null,
          vendorName: null,
          isTour: true,
          tourId: String(tour.id),
          tourSlug: tour.slug
        },
        pois: zoneRows.map((z) => ({
          id: String(z.id),
          name: z.name,
          slug: z.slug,
          description: z.description,
          latitude: Number(z.latitude),
          longitude: Number(z.longitude),
          isPremiumContent: Boolean(z.is_premium_content),
          activationRadius: Number(z.activation_radius),
          status: z.status,
          sortOrder: Number(z.sort_order ?? 0),
          languageCount: Number(z.language_count ?? 0),
          audioUrlVi: z.audio_url_vi,
          stallName: z.stall_name ?? null,
          tourId: String(z.tour_id),
          tourSlug: tour.slug
        }))
      })
    );
  })
);

export default router;
