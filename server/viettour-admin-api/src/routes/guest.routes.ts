import { Request, Router } from 'express';
import geoip from 'geoip-lite';
import { query } from '../lib/db';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';
import { PoiController } from '../controllers/poi.controller';

export const router = Router();
const poiController = new PoiController();

// GET /pois — Public guest POIs lookup
router.get(
  '/pois',
  asyncHandler(poiController.getGuestPois)
);


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
    const lang = typeof req.query.lang === 'string' ? req.query.lang.trim() : 'vi';
    const normalizedLang = ['vi', 'en', 'ja', 'ko', 'zh'].includes(lang) ? lang : 'vi';

    const translations: Record<string, Record<string, string>> = {
      vi: {
        'error.invalid_code': 'Mã không hợp lệ.',
        'error.code_not_found': 'Mã không tồn tại hoặc không tìm thấy.',
        'error.database_error': 'Lỗi kết nối cơ sở dữ liệu.'
      },
      en: {
        'error.invalid_code': 'Invalid code.',
        'error.code_not_found': 'Code not found.',
        'error.database_error': 'Database connection error.'
      },
      ja: {
        'error.invalid_code': '無効なコード。',
        'error.code_not_found': 'コードが見つかりません。',
        'error.database_error': 'データベース接続エラー。'
      },
      ko: {
        'error.invalid_code': '유효하지 않은 코드입니다.',
        'error.code_not_found': '코드를 찾을 수 없습니다.',
        'error.database_error': '데이터베이스 연결 오류입니다.'
      },
      zh: {
        'error.invalid_code': '无效的代码。',
        'error.code_not_found': '未找到代码。',
        'error.database_error': '数据库错误。'
      }
    };

    const t = (key: string): string => {
      return translations[normalizedLang]?.[key] ?? translations['vi']?.[key] ?? key;
    };

    try {
      if (!code || code.length < 2 || code.length > 50) {
        res.status(400).json({ success: false, error: t('error.invalid_code'), message: t('error.invalid_code') });
        return;
      }

      let tour: any = null;
      let qrCodeId: string | null = null;
      const isNumeric = /^\d+$/.test(code);

      // Strategy 1: Find Tour via QR code table
      const qrRows = await query<any[]>(
        `SELECT qr.id AS qr_id, qr.tour_id, qr.vendor_id, qr.code AS qr_code,
                t.id AS t_id, t.name, t.slug, t.description, t.status, t.vendor_id AS t_vendor_id,
                t.is_premium AS t_is_premium, t.price AS t_price
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
          zone_code: row.qr_code,
          is_premium: row.t_is_premium,
          price: row.t_price
        };
      }

      // Strategy 2: Find Tour by slug or numeric ID (manual code entry)
      if (!tour) {
        let slugRows: any[] = [];
        if (isNumeric) {
          slugRows = await query<any[]>(
            `SELECT t.id, t.name, t.slug, t.description, t.status, t.vendor_id,
                    t.is_premium, t.price,
                    (SELECT qr.code FROM qr_codes qr WHERE qr.tour_id = t.id AND qr.qr_type = 'TOUR' AND qr.is_active = 1 LIMIT 1) AS qr_code
             FROM tours t
             WHERE t.id = ? AND t.status = 'PUBLISHED'
             LIMIT 1`,
            [code]
          );
        } else {
          slugRows = await query<any[]>(
            `SELECT t.id, t.name, t.slug, t.description, t.status, t.vendor_id,
                    t.is_premium, t.price,
                    (SELECT qr.code FROM qr_codes qr WHERE qr.tour_id = t.id AND qr.qr_type = 'TOUR' AND qr.is_active = 1 LIMIT 1) AS qr_code
             FROM tours t
             WHERE t.slug = ? AND t.status = 'PUBLISHED'
             LIMIT 1`,
            [code.toLowerCase()]
          );
        }
        if (slugRows.length > 0) {
          const row = slugRows[0];
          tour = {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            status: row.status,
            vendor_id: row.vendor_id,
            zone_code: row.qr_code || row.slug,
            is_premium: row.is_premium,
            price: row.price
          };
        }
      }

      // Strategy 3: Legacy fallback — find stall by zone_code or numeric ID, return its POIs from zones
      if (!tour) {
        let stallRows: any[] = [];
        if (isNumeric) {
          stallRows = await query<any[]>(
            `SELECT
               s.id, s.vendor_id,
               COALESCE(sc_lang.name, sc_vi.name, s.name) AS name,
               s.slug,
               COALESCE(sc_lang.description, sc_vi.description, s.description) AS description,
               s.address,
               s.latitude, s.longitude, s.activation_radius, s.status,
               s.is_featured, s.zone_code, s.opening_hours,
               v.trade_name AS vendor_name
             FROM stalls s
             JOIN vendors v ON v.id = s.vendor_id
             LEFT JOIN stall_contents sc_lang ON sc_lang.stall_id = s.id AND sc_lang.lang = ?
             LEFT JOIN stall_contents sc_vi ON sc_vi.stall_id = s.id AND sc_vi.lang = 'vi'
             WHERE s.id = ?
             LIMIT 1`,
            [lang, code]
          );
        } else {
          stallRows = await query<any[]>(
            `SELECT
               s.id, s.vendor_id,
               COALESCE(sc_lang.name, sc_vi.name, s.name) AS name,
               s.slug,
               COALESCE(sc_lang.description, sc_vi.description, s.description) AS description,
               s.address,
               s.latitude, s.longitude, s.activation_radius, s.status,
               s.is_featured, s.zone_code, s.opening_hours,
               v.trade_name AS vendor_name
             FROM stalls s
             JOIN vendors v ON v.id = s.vendor_id
             LEFT JOIN stall_contents sc_lang ON sc_lang.stall_id = s.id AND sc_lang.lang = ?
             LEFT JOIN stall_contents sc_vi ON sc_vi.stall_id = s.id AND sc_vi.lang = 'vi'
             WHERE (REPLACE(s.zone_code, '-', '') = REPLACE(?, '-', '') OR s.slug = ?)
             LIMIT 1`,
            [lang, code.toUpperCase(), code.toLowerCase()]
          );
        }

        if (stallRows.length === 0) {
          res.status(404).json({ success: false, error: t('error.code_not_found'), message: t('error.code_not_found') });
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
        let poiRows: any[] = [];
        try {
          poiRows = await query<any[]>(
            `SELECT
               z.id,
               COALESCE(pc_lang.title, pc_vi.title, z.name) AS name,
               z.slug,
               COALESCE(pc_lang.tts_script, pc_vi.tts_script, z.description) AS description,
               z.latitude, z.longitude,
               z.activation_radius, z.is_premium_content, z.status, z.sort_order,
               z.stall_id,
               (SELECT COUNT(DISTINCT pc.lang) FROM poi_contents pc WHERE pc.poi_id = z.id AND pc.approval_status = 'approved') AS language_count,
               (SELECT pc.audio_url FROM poi_contents pc WHERE pc.poi_id = z.id AND pc.lang = ? AND pc.approval_status = 'approved' LIMIT 1) AS audio_url,
               (SELECT pc.audio_url FROM poi_contents pc WHERE pc.poi_id = z.id AND pc.lang = 'vi' AND pc.approval_status = 'approved' LIMIT 1) AS audio_url_vi,
               COALESCE(sc_lang.name, sc_vi.name, s.name) AS stall_name,
               COALESCE(sc_lang.description, sc_vi.description, s.description) AS stall_description
             FROM zones z
             LEFT JOIN stalls s ON s.id = z.stall_id
             LEFT JOIN stall_contents sc_lang ON sc_lang.stall_id = s.id AND sc_lang.lang = ?
             LEFT JOIN stall_contents sc_vi ON sc_vi.stall_id = s.id AND sc_vi.lang = 'vi'
             LEFT JOIN poi_contents pc_lang ON pc_lang.poi_id = z.id AND pc_lang.lang = ? AND pc_lang.approval_status = 'approved'
             LEFT JOIN poi_contents pc_vi ON pc_vi.poi_id = z.id AND pc_vi.lang = 'vi' AND pc_vi.approval_status = 'approved'
             WHERE z.stall_id = ? AND z.status = 'ACTIVE'
             ORDER BY z.sort_order ASC, z.id ASC`,
            [lang, lang, lang, lang, stall.id.toString()]
          );
        } catch (err: any) {
          console.error('Error fetching zones for stall:', err);
          res.status(500).json({ success: false, error: t('error.database_error'), message: t('error.database_error') });
          return;
        }

        res.json(
          ok({
            stall: {
              id: Number(stall.id),
              zone_code: stall.zone_code,
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
              activationRadius: Number(poi.activation_radius),
              status: poi.status,
              sortOrder: Number(poi.sort_order ?? 0),
              languageCount: Number(poi.language_count ?? 0),
              audioUrl: poi.audio_url || poi.audio_url_vi || null,
              audioUrlVi: poi.audio_url_vi,
              stallId: Number(poi.stall_id),
              stall_id: Number(poi.stall_id),
              stallName: poi.stall_name ?? null,
              stall_name: poi.stall_name ?? null,
              stall_description: poi.stall_description ?? null
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
      let zoneRows: any[] = [];
      try {
        zoneRows = await query<any[]>(
          `SELECT
             z.id,
             COALESCE(pc_lang.title, pc_vi.title, z.name) AS name,
             z.slug,
             COALESCE(pc_lang.tts_script, pc_vi.tts_script, z.description) AS description,
             z.latitude, z.longitude,
             z.activation_radius, z.is_premium_content, z.status, z.sort_order,
             z.tour_id,
             z.stall_id,
             (SELECT COUNT(DISTINCT pc.lang) FROM poi_contents pc WHERE pc.poi_id = z.id AND pc.approval_status = 'approved') AS language_count,
             (SELECT pc.audio_url FROM poi_contents pc WHERE pc.poi_id = z.id AND pc.lang = ? AND pc.approval_status = 'approved' LIMIT 1) AS audio_url,
             (SELECT pc.audio_url FROM poi_contents pc WHERE pc.poi_id = z.id AND pc.lang = 'vi' AND pc.approval_status = 'approved' LIMIT 1) AS audio_url_vi,
             COALESCE(sc_lang.name, sc_vi.name, s.name) AS stall_name,
             COALESCE(sc_lang.description, sc_vi.description, s.description) AS stall_description
           FROM zones z
           LEFT JOIN stalls s ON s.id = z.stall_id
           LEFT JOIN stall_contents sc_lang ON sc_lang.stall_id = s.id AND sc_lang.lang = ?
           LEFT JOIN stall_contents sc_vi ON sc_vi.stall_id = s.id AND sc_vi.lang = 'vi'
           LEFT JOIN poi_contents pc_lang ON pc_lang.poi_id = z.id AND pc_lang.lang = ? AND pc_lang.approval_status = 'approved'
           LEFT JOIN poi_contents pc_vi ON pc_vi.poi_id = z.id AND pc_vi.lang = 'vi' AND pc_vi.approval_status = 'approved'
           WHERE z.tour_id = ? AND z.status = 'ACTIVE'
           ORDER BY z.sort_order ASC, z.id ASC`,
          [lang, lang, lang, String(tour.id)]
        );
      } catch (err: any) {
        console.error('Error fetching zones for tour:', err);
        res.status(500).json({ success: false, error: t('error.database_error'), message: t('error.database_error') });
        return;
      }

      // Return Tour info in `stall` field for backward compatibility with client
      res.json(
        ok({
          stall: {
            id: Number(tour.id),
            zone_code: tour.zone_code || tour.slug,
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
            tourId: Number(tour.id),
            tourSlug: tour.slug,
            isPremium: Boolean(tour.is_premium),
            price: Number(tour.price)
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
            audioUrl: z.audio_url || z.audio_url_vi || null,
            audioUrlVi: z.audio_url_vi,
            stallId: z.stall_id ? Number(z.stall_id) : null,
            stall_id: z.stall_id ? Number(z.stall_id) : null,
            stallName: z.stall_name ?? null,
            stall_name: z.stall_name ?? null,
            stall_description: z.stall_description ?? null,
            tourId: String(z.tour_id),
            tourSlug: tour.slug
          }))
        })
      );
    } catch (error) {
      console.error('Resolve code error:', error);
      res.status(404).json({ success: false, error: t('error.code_not_found'), message: t('error.code_not_found') });
    }
  })
);

// ──────────────────────────────────────────────
// GET /favorites/:guestId — Public, no auth
// Retrieve guest's favorited stall IDs mapped from pois
// ──────────────────────────────────────────────
router.get(
  '/favorites/:guestId',
  asyncHandler(async (req, res) => {
    const guestId = String(req.params.guestId);
    const rows = await query<any[]>(
      `SELECT DISTINCT p.stall_id
       FROM favorites f
       JOIN pois p ON p.id = f.poi_id
       WHERE f.guest_id = ?`,
      [guestId]
    );
    res.json(ok({ favorites: rows.map((r) => Number(r.stall_id)) }));
  })
);

// ──────────────────────────────────────────────
// POST /favorites/sync — Public, no auth
// Sync guest's offline favorite operations
// ──────────────────────────────────────────────
router.post(
  '/favorites/sync',
  asyncHandler(async (req, res) => {
    const { guestId, ops } = req.body;
    if (!guestId || !Array.isArray(ops)) {
      res.status(400).json({ success: false, error: 'guestId and ops are required' });
      return;
    }

    for (const op of ops) {
      const stallId = Number(op.stallId);
      if (!stallId) continue;

      // Find the corresponding POI for this stall
      const poiRows = await query<any[]>(
        `SELECT id FROM pois WHERE stall_id = ? LIMIT 1`,
        [stallId]
      );
      if (poiRows.length === 0) continue;
      const poiId = poiRows[0].id;

      if (op.action === 'add') {
        await query(
          `INSERT INTO favorites (guest_id, poi_id, added_at)
           VALUES (?, ?, NOW())
           ON DUPLICATE KEY UPDATE added_at = NOW()`,
          [guestId, String(poiId)]
        );
      } else if (op.action === 'remove') {
        await query(
          `DELETE FROM favorites WHERE guest_id = ? AND poi_id = ?`,
          [guestId, String(poiId)]
        );
      }
    }

    const rows = await query<any[]>(
      `SELECT DISTINCT p.stall_id
       FROM favorites f
       JOIN pois p ON p.id = f.poi_id
       WHERE f.guest_id = ?`,
      [guestId]
    );
    res.json(ok({ favorites: rows.map((r) => Number(r.stall_id)) }));
  })
);

// ──────────────────────────────────────────────
// GET /tours/:id/unlocked-status — Public, no auth
// Checks if the tour is unlocked for a guest, or if it is free (price = 0)
// ──────────────────────────────────────────────
router.get(
  '/tours/:id/unlocked-status',
  asyncHandler(async (req, res) => {
    const tourId = Number(req.params.id);
    const guestId = String(req.query.guestId || '');

    if (!tourId) {
      res.status(400).json({ success: false, error: 'tourId is required' });
      return;
    }

    // 1. Fetch tour details (price, is_premium)
    const tourRows = await query<any[]>(
      'SELECT is_premium, price FROM tours WHERE id = ? LIMIT 1',
      [tourId]
    );

    if (tourRows.length === 0) {
      res.status(404).json({ success: false, error: 'Tour not found' });
      return;
    }

    const tour = tourRows[0];
    const isPremium = Boolean(tour.is_premium);
    const price = Number(tour.price);

    // If it's free or not premium, it is unlocked
    if (!isPremium || price === 0) {
      res.json(ok({ unlocked: true, price: 0 }));
      return;
    }

    if (!guestId) {
      res.json(ok({ unlocked: false, price }));
      return;
    }

    // 2. Check if the guest has unlocked it in the database
    const unlockRows = await query<any[]>(
      'SELECT id FROM unlocked_tours WHERE guest_id = ? AND tour_id = ? LIMIT 1',
      [guestId, tourId]
    );

    res.json(
      ok({
        unlocked: unlockRows.length > 0,
        price
      })
    );
  })
);

// ──────────────────────────────────────────────
// GET /routing — Proxy routing via OpenRouteService or fallback OSRM
// ──────────────────────────────────────────────
router.get(
  '/routing',
  asyncHandler(async (req, res) => {
    const startLng = String(req.query.startLng || '');
    const startLat = String(req.query.startLat || '');
    const endLng = String(req.query.endLng || '');
    const endLat = String(req.query.endLat || '');

    if (!startLng || !startLat || !endLng || !endLat) {
      res.status(400).json({ success: false, error: 'Missing coordinates' });
      return;
    }

    const orsKey = process.env.ORS_API_KEY || '5b3ce3597851110001cf62483861fb85ea4f4d22bb42c55452eb8c15';

    try {
      const orsUrl = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${orsKey}&start=${startLng},${startLat}&end=${endLng},${endLat}`;
      const orsRes = await fetch(orsUrl);
      if (orsRes.ok) {
        const data = await orsRes.json() as any;
        const feature = data.features?.[0];
        if (feature) {
          res.json(
            ok({
              source: 'ors',
              routes: [
                {
                  geometry: feature.geometry,
                  distance: feature.properties?.summary?.distance ?? 0,
                  duration: feature.properties?.summary?.duration ?? 0
                }
              ]
            })
          );
          return;
        }
      }
    } catch (err) {
      console.warn('OpenRouteService routing error, trying fallback:', err);
    }

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl);
      if (osrmRes.ok) {
        const data = await osrmRes.json() as any;
        if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
          res.json(
            ok({
              source: 'osrm',
              routes: data.routes
            })
          );
          return;
        }
      }
    } catch (err) {
      console.error('OSRM fallback routing error:', err);
    }

    res.status(502).json({ success: false, error: 'Both routing services failed' });
  })
);

// ──────────────────────────────────────────────
// GET /tours — Retrieve all active Tours (Khu vực) and their child POIs (Zones)
// ──────────────────────────────────────────────
router.get(
  '/tours',
  asyncHandler(async (req, res) => {
    const lang = typeof req.query.lang === 'string' ? req.query.lang.trim() : 'vi';
    const normalizedLang = ['vi', 'en', 'ja', 'ko', 'zh'].includes(lang) ? lang : 'vi';

    const tourRows = await query<any[]>(
      `SELECT t.id, t.name, t.slug, t.description, t.cover_image_url, t.is_premium, t.price,
              (SELECT COUNT(*) FROM zones z JOIN stalls s ON s.id = z.stall_id
               WHERE z.tour_id = t.id AND z.status = 'ACTIVE' AND z.approval_status = 'APPROVED' AND s.status = 'APPROVED') AS poi_count
       FROM tours t
       WHERE t.status = 'PUBLISHED'
       ORDER BY t.sort_order ASC, t.id ASC`
    );

    const result = [];
    for (const tour of tourRows) {
      const pois = await query<any[]>(
        `SELECT z.id, 
                COALESCE(pc_lang.title, pc_vi.title, z.name) AS name, 
                z.slug, 
                COALESCE(pc_lang.tts_script, pc_vi.tts_script, z.description) AS description, 
                z.latitude, z.longitude, z.activation_radius, z.is_premium_content, z.stall_id
         FROM zones z
         JOIN stalls s ON s.id = z.stall_id
         LEFT JOIN poi_contents pc_lang ON pc_lang.poi_id = z.id AND pc_lang.lang = ? AND pc_lang.approval_status = 'approved'
         LEFT JOIN poi_contents pc_vi ON pc_vi.poi_id = z.id AND pc_vi.lang = 'vi' AND pc_vi.approval_status = 'approved'
         WHERE z.tour_id = ?
           AND z.status = 'ACTIVE'
           AND z.approval_status = 'APPROVED'
           AND s.status = 'APPROVED'
         ORDER BY z.sort_order ASC, z.id ASC`,
        [normalizedLang, tour.id.toString()]
      );

      result.push({
        id: Number(tour.id),
        name: tour.name,
        slug: tour.slug,
        description: tour.description,
        cover_image_url: tour.cover_image_url,
        coverImage: tour.cover_image_url,
        is_premium: Boolean(tour.is_premium),
        price: Number(tour.price ?? 0),
        poi_count: Number(tour.poi_count ?? 0),
        pois: pois.map(p => ({
          id: Number(p.id),
          name: p.name,
          title: p.name,
          slug: p.slug,
          description: p.description,
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          activationRadius: Number(p.activation_radius),
          premium: Boolean(p.is_premium_content),
          stallId: p.stall_id
        }))
      });
    }

    res.json(ok(result));
  })
);

// ──────────────────────────────────────────────
// POST /tickets — Submit a support or registration request ticket
// ──────────────────────────────────────────────
router.post(
  '/tickets',
  asyncHandler(async (req, res) => {
    const { email, subject, message } = req.body;

    const emailStr = (typeof email === 'string' ? email : '').trim();
    const subjectStr = (typeof subject === 'string' ? subject : '').trim();
    const messageStr = (typeof message === 'string' ? message : '').trim();

    if (!emailStr || !subjectStr || !messageStr) {
      res.status(400).json({ success: false, error: 'Email, subject and message are required' });
      return;
    }

    await query(
      `INSERT INTO system_tickets (sender_email, subject, message, status) VALUES (?, ?, ?, 'PENDING')`,
      [emailStr, subjectStr, messageStr]
    );

    res.json(ok({ message: 'Ticket submitted successfully' }));
  })
);

export default router;
