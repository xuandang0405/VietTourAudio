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
// Resolve a zone_code to Stall info + its POIs
// ──────────────────────────────────────────────
router.get(
  '/resolve-code/:code',
  asyncHandler(async (req, res) => {
    const rawCode = req.params.code;
    const code = (typeof rawCode === 'string' ? rawCode : '').trim().toUpperCase();

    if (!code || code.length < 2 || code.length > 50) {
      res.status(400).json({ success: false, error: 'Invalid zone code format' });
      return;
    }

    // Find stall by zone_code
    const stallRows = await query<any[]>(
      `SELECT
         s.id,
         s.vendor_id,
         s.name,
         s.slug,
         s.description,
         s.address,
         s.latitude,
         s.longitude,
         s.activation_radius,
         s.status,
         s.is_featured,
         s.zone_code,
         s.opening_hours,
         v.trade_name AS vendor_name
       FROM stalls s
       JOIN vendors v ON v.id = s.vendor_id
       WHERE s.zone_code = ?
       LIMIT 1`,
      [code]
    );

    if (stallRows.length === 0) {
      res.status(404).json({ success: false, error: 'Zone code not found' });
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

    // Fetch POIs belonging to this stall
    const poiRows = await query<any[]>(
      `SELECT
         p.id,
         p.name,
         p.slug,
         p.description,
         p.latitude,
         p.longitude,
         p.is_premium_content,
         p.status,
         p.sort_order,
         (SELECT COUNT(DISTINCT pc.lang) FROM poi_contents pc WHERE pc.poi_id = p.id) AS language_count,
         (SELECT pc.audio_url FROM poi_contents pc WHERE pc.poi_id = p.id AND pc.lang = 'vi' LIMIT 1) AS audio_url_vi
       FROM pois p
       WHERE p.stall_id = ? AND p.status = 'ACTIVE'
       ORDER BY p.sort_order ASC, p.id ASC`,
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
  })
);

export default router;
