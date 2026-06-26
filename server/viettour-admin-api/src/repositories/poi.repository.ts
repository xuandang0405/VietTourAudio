import { query, pool } from '../lib/db';
import { translateDynamicFields } from '../utils/translator';
import { ZoneModel } from '../types/models.types';

export class PoiRepository {
  async getPoiRow(id: bigint, tourScopeClause = '', tourScopeParams: unknown[] = []): Promise<ZoneModel | null> {
    const rows = await query<any[]>(
      `SELECT z.*, s.name AS stall_name
       FROM zones z
       LEFT JOIN stalls s ON s.id = z.stall_id
       LEFT JOIN tours t ON t.id = z.tour_id
       WHERE z.id = ?
       ${tourScopeClause}
       LIMIT 1`,
      [id.toString(), ...tourScopeParams]
    );
    return rows[0] || null;
  }

  async isStallAllowed(stallId: string, tourScopeClause = '', tourScopeParams: unknown[] = []): Promise<boolean> {
    const rows = await query<any[]>(
      `SELECT s.id FROM stalls s 
       LEFT JOIN vendors v ON v.id = s.vendor_id
       WHERE s.id = ? ${tourScopeClause} LIMIT 1`,
      [stallId, ...tourScopeParams]
    );
    return rows.length > 0;
  }

  async getAllPois(tourScopeClause = '', tourScopeParams: unknown[] = []): Promise<ZoneModel[]> {
    const rows = await query<any[]>(
      `SELECT z.*, s.name AS stall_name,
              (SELECT COUNT(*) FROM poi_contents pc WHERE pc.poi_id = z.id) AS contents_count,
              (SELECT COUNT(*) FROM media_files mf WHERE mf.poi_id = z.id) AS media_count
       FROM zones z
       LEFT JOIN stalls s ON s.id = z.stall_id
       LEFT JOIN tours t ON t.id = z.tour_id
       WHERE z.status != 'HIDDEN'
       ${tourScopeClause}
       ORDER BY z.sort_order ASC, z.id DESC`,
      tourScopeParams
    );
    return rows;
  }

  async getAllStalls(tourScopeClause = '', tourScopeParams: unknown[] = []): Promise<{ id: string; name: string }[]> {
    const rows = await query<any[]>(
      `SELECT s.id, s.name FROM stalls s 
       LEFT JOIN vendors v ON v.id = s.vendor_id
       WHERE 1 = 1 ${tourScopeClause} ORDER BY s.name ASC`,
      tourScopeParams
    );
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
    }));
  }

  async getDistanceSphere(
    poi1Id: bigint,
    poi2Id: bigint,
    tourScope1Clause = '',
    tourScope1Params: unknown[] = [],
    tourScope2Clause = '',
    tourScope2Params: unknown[] = []
  ): Promise<number | null> {
    const rows = await query<any[]>(
      `SELECT ST_Distance_Sphere(
          POINT(z1.longitude, z1.latitude),
          POINT(z2.longitude, z2.latitude)
        ) AS distance_meters
       FROM zones z1
       LEFT JOIN tours t1 ON t1.id = z1.tour_id
       JOIN zones z2 ON z2.id = ?
       LEFT JOIN tours t2 ON t2.id = z2.tour_id
       WHERE z1.id = ?
         AND z1.status != 'HIDDEN'
         AND z2.status != 'HIDDEN'
         ${tourScope1Clause}
         ${tourScope2Clause}
       LIMIT 1`,
      [poi2Id.toString(), poi1Id.toString(), ...tourScope1Params, ...tourScope2Params]
    );

    if (!rows[0] || rows[0].distance_meters == null) {
      return null;
    }
    return Number(rows[0].distance_meters);
  }

  async insertPoi(data: {
    tourId: number | string;
    stallId: number | string;
    name: string;
    slug: string;
    description?: string | null;
    latitude: number;
    longitude: number;
    activationRadius?: number;
    isPremiumContent: boolean;
    status?: string;
    translations?: { lang: string; title: string; ttsScript: string }[];
  }): Promise<bigint> {
    const tourId = BigInt(data.tourId).toString();
    const stallId = BigInt(data.stallId).toString();

    // 1. Fetch dynamic translations concurrently in the background first (outside transaction block)
    let transMap: Record<string, { title: string; description: string }> = {};
    try {
      transMap = await translateDynamicFields({
        title: data.name,
        description: data.description || '',
      });
    } catch (err: any) {
      console.error('Dynamic background POI translation helper failed:', err.message);
    }

    // 2. Open transaction and insert all variants into database
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert into legacy pois table
      const [resultPoi] = await connection.execute<any>(
        `INSERT INTO pois (stall_id, zone_code, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          stallId,
          null, // zone_code
          2, // free_listens_allowed
          data.name,
          data.slug,
          data.description || null,
          data.latitude,
          data.longitude,
          data.activationRadius || 25,
          data.isPremiumContent ? 1 : 0,
          data.status || 'ACTIVE',
        ]
      );
      const poiId = resultPoi.insertId;

      // Insert into zones table
      await connection.execute(
        `INSERT INTO zones (id, tour_id, stall_id, free_listens_allowed, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order)
         VALUES (?, ?, ?, 2, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          poiId,
          tourId,
          stallId,
          data.name,
          data.slug,
          data.description || null,
          data.latitude,
          data.longitude,
          data.activationRadius || 25,
          data.isPremiumContent ? 1 : 0,
          data.status || 'ACTIVE',
        ]
      );

      // Insert into tour_pois
      await connection.execute(
        `INSERT INTO tour_pois (tour_id, poi_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE tour_id = tour_id`,
        [tourId, poiId]
      );

      // Insert 'vi' content
      await connection.execute(
        `INSERT INTO poi_contents (poi_id, lang, title, short_text, tts_script, approval_status)
         VALUES (?, 'vi', ?, ?, ?, 'approved')
         ON DUPLICATE KEY UPDATE title = VALUES(title), tts_script = VALUES(tts_script), approval_status = 'approved'`,
        [
          poiId.toString(),
          data.name,
          data.name,
          data.description || '',
        ]
      );

      // Insert other translations
      for (const lang of ['en', 'ja', 'ko', 'zh']) {
        const trans = transMap[lang] || { title: '', description: '' };
        await connection.execute(
          `INSERT INTO poi_contents (poi_id, lang, title, short_text, tts_script, approval_status)
           VALUES (?, ?, ?, ?, ?, 'approved')
           ON DUPLICATE KEY UPDATE title = VALUES(title), tts_script = VALUES(tts_script), approval_status = 'approved'`,
          [
            poiId.toString(),
            lang,
            trans.title || data.name,
            trans.title || data.name,
            trans.description || data.description || '',
          ]
        );
      }

      await connection.commit();
      return BigInt(poiId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async updatePoi(
    id: bigint,
    data: {
      tourId: number | string;
      stallId: number | string;
      name: string;
      slug: string;
      description?: string | null;
      latitude: number;
      longitude: number;
      activationRadius: number;
      isPremiumContent: boolean;
      status: string;
      translations?: { lang: string; title: string; ttsScript: string }[];
    }
  ): Promise<void> {
    const tourId = BigInt(data.tourId).toString();
    const stallId = BigInt(data.stallId).toString();

    // Update pois table
    await query(
      `UPDATE pois
       SET stall_id = ?, name = ?, slug = ?, description = ?, latitude = ?, longitude = ?, activation_radius = ?, is_premium_content = ?, status = ?
       WHERE id = ?`,
      [
        stallId,
        data.name,
        data.slug,
        data.description || null,
        data.latitude,
        data.longitude,
        data.activationRadius,
        data.isPremiumContent ? 1 : 0,
        data.status,
        id.toString(),
      ]
    );

    // Update zones table
    await query(
      `UPDATE zones
       SET tour_id = ?, stall_id = ?, name = ?, slug = ?, description = ?, latitude = ?, longitude = ?, activation_radius = ?, is_premium_content = ?, status = ?
       WHERE id = ?`,
      [
        tourId,
        stallId,
        data.name,
        data.slug,
        data.description || null,
        data.latitude,
        data.longitude,
        data.activationRadius,
        data.isPremiumContent ? 1 : 0,
        data.status,
        id.toString(),
      ]
    );

    // Update/ensure tour_pois junction row matches
    await query(
      `INSERT INTO tour_pois (tour_id, poi_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE tour_id = VALUES(tour_id)`,
      [tourId, id.toString()]
    );

    // Update/insert multilingual translations into poi_contents
    if (data.translations && data.translations.length > 0) {
      for (const t of data.translations) {
        await query(
          `INSERT INTO poi_contents (poi_id, lang, title, short_text, tts_script, approval_status)
           VALUES (?, ?, ?, ?, ?, 'approved')
           ON DUPLICATE KEY UPDATE title = VALUES(title), tts_script = VALUES(tts_script), approval_status = 'approved'`,
          [
            id.toString(),
            t.lang,
            t.title,
            t.title, // short_text
            t.ttsScript,
          ]
        );
      }
    } else {
      // Fallback: at least update the main Vietnamese content
      await query(
        `INSERT INTO poi_contents (poi_id, lang, title, short_text, tts_script, approval_status)
         VALUES (?, 'vi', ?, ?, ?, 'approved')
         ON DUPLICATE KEY UPDATE title = VALUES(title), tts_script = VALUES(tts_script), approval_status = 'approved'`,
        [
          id.toString(),
          data.name,
          data.name,
          data.description || '',
        ]
      );
    }
  }

  async deletePoi(id: bigint): Promise<void> {
    await query(`UPDATE pois SET status = 'HIDDEN' WHERE id = ?`, [id.toString()]);
    await query(`UPDATE zones SET status = 'HIDDEN' WHERE id = ?`, [id.toString()]);
  }

  async getActiveZones(): Promise<any[]> {
    const rows = await query<any[]>(
      `SELECT z.id, z.name, z.slug, z.tour_id, z.stall_id, z.latitude, z.longitude, z.activation_radius,
              z.is_premium_content, z.status, t.name AS tour_name, t.slug AS tour_slug
       FROM zones z
       LEFT JOIN tours t ON t.id = z.tour_id
       WHERE z.status = 'ACTIVE'
       ORDER BY z.tour_id ASC, z.sort_order ASC`
    );
    return rows;
  }

  async getGuestPoisByZoneCode(zoneCode: string, lang: string): Promise<any[]> {
    const isNumeric = /^\d+$/.test(zoneCode);
    const queryStr = `
      SELECT
        p.id,
        p.stall_id,
        COALESCE(pc_lang.title, pc_vi.title, p.name) AS name,
        p.slug,
        COALESCE(pc_lang.tts_script, pc_vi.tts_script, p.description) AS description,
        p.latitude,
        p.longitude,
        p.activation_radius,
        p.is_premium_content,
        p.status,
        p.sort_order,
        p.zone_code,
        s.name AS stall_name,
        z.tour_id,
        t.slug AS tour_slug,
        (SELECT COUNT(DISTINCT pc.lang) FROM poi_contents pc WHERE pc.poi_id = p.id) AS language_count,
        (SELECT pc.audio_url FROM poi_contents pc WHERE pc.poi_id = p.id AND pc.lang = ? LIMIT 1) AS audio_url,
        (SELECT pc.audio_url FROM poi_contents pc WHERE pc.poi_id = p.id AND pc.lang = 'vi' LIMIT 1) AS audio_url_vi
      FROM pois p
      LEFT JOIN stalls s ON s.id = p.stall_id
      LEFT JOIN zones z ON z.id = p.id
      LEFT JOIN tours t ON t.id = z.tour_id
      LEFT JOIN poi_contents pc_lang ON pc_lang.poi_id = p.id AND pc_lang.lang = ?
      LEFT JOIN poi_contents pc_vi ON pc_vi.poi_id = p.id AND pc_vi.lang = 'vi'
      WHERE (
        p.zone_code = ? OR
        s.zone_code = ? OR
        s.slug = ? OR
        t.slug = ?
        ${isNumeric ? 'OR t.id = ? OR s.id = ?' : ''}
      ) AND p.status = 'ACTIVE'
      ORDER BY p.sort_order ASC, p.id ASC
    `;

    const params: any[] = [
      lang,
      lang,
      zoneCode,
      zoneCode,
      zoneCode,
      zoneCode
    ];

    if (isNumeric) {
      params.push(zoneCode, zoneCode);
    }

    const rows = await query<any[]>(queryStr, params);
    return rows;
  }
}

export class TourRepository {
  async getAllTours(): Promise<any[]> {
    const rows = await query<any[]>(
      `SELECT t.*,
              v.trade_name AS vendor_name,
              (SELECT COUNT(*) FROM zones z WHERE z.tour_id = t.id AND z.status != 'HIDDEN') AS poi_count,
              (SELECT qr.code FROM qr_codes qr WHERE qr.tour_id = t.id AND qr.qr_type = 'TOUR' AND qr.is_active = 1 LIMIT 1) AS qr_code,
              (SELECT qr.image_url FROM qr_codes qr WHERE qr.tour_id = t.id AND qr.qr_type = 'TOUR' AND qr.is_active = 1 LIMIT 1) AS qr_image_url
       FROM tours t
       LEFT JOIN vendors v ON v.id = t.vendor_id
       WHERE t.status != 'ARCHIVED'
       ORDER BY t.sort_order ASC, t.id DESC`
    );
    return rows;
  }

  async getTourById(id: bigint): Promise<any[] | null> {
    const rows = await query<any[]>(
      `SELECT t.*,
              v.trade_name AS vendor_name,
              (SELECT COUNT(*) FROM zones z WHERE z.tour_id = t.id AND z.status != 'HIDDEN') AS poi_count,
              (SELECT qr.code FROM qr_codes qr WHERE qr.tour_id = t.id AND qr.qr_type = 'TOUR' AND qr.is_active = 1 LIMIT 1) AS qr_code,
              (SELECT qr.image_url FROM qr_codes qr WHERE qr.tour_id = t.id AND qr.qr_type = 'TOUR' AND qr.is_active = 1 LIMIT 1) AS qr_image_url,
              z.id AS poi_id,
              z.name AS poi_name,
              z.latitude AS poi_latitude,
              z.longitude AS poi_longitude,
              z.status AS poi_status,
              z.activation_radius,
              (SELECT COUNT(*) FROM poi_contents pc WHERE pc.poi_id = z.id) AS contents_count,
              (SELECT COUNT(*) FROM media_files mf WHERE mf.poi_id = z.id) AS media_count,
              s.name AS stall_name
       FROM tours t
       LEFT JOIN vendors v ON v.id = t.vendor_id
       LEFT JOIN zones z ON t.id = z.tour_id AND z.status != 'HIDDEN'
       LEFT JOIN stalls s ON s.id = z.stall_id
       WHERE t.id = ?`,
      [id.toString()]
    );
    return rows.length > 0 ? rows : null;
  }

  async insertTour(data: {
    vendorId: number | string;
    name: string;
    slug: string;
    description?: string | null;
    status?: string;
    isPremium?: boolean;
    latitude?: number | string | null;
    longitude?: number | string | null;
    coverImageUrl?: string | null;
  }): Promise<bigint> {
    const result = await query<any>(
      `INSERT INTO tours (vendor_id, name, slug, description, status, is_premium, sort_order, latitude, longitude, cover_image_url)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        data.vendorId,
        data.name,
        data.slug,
        data.description || null,
        data.status || 'DRAFT',
        data.isPremium ? 1 : 0,
        data.latitude !== undefined && data.latitude !== null ? data.latitude : null,
        data.longitude !== undefined && data.longitude !== null ? data.longitude : null,
        data.coverImageUrl || null,
      ]
    );
    return BigInt(result.insertId);
  }

  async updateTour(
    id: bigint,
    data: {
      vendorId: number | string;
      name: string;
      slug: string;
      description?: string | null;
      status: string;
      isPremium: boolean;
      latitude?: number | string | null;
      longitude?: number | string | null;
      coverImageUrl?: string | null;
    }
  ): Promise<void> {
    await query(
      `UPDATE tours SET vendor_id = ?, name = ?, slug = ?, description = ?, status = ?, is_premium = ?, latitude = ?, longitude = ?, cover_image_url = ?
       WHERE id = ?`,
      [
        data.vendorId,
        data.name,
        data.slug,
        data.description || null,
        data.status,
        data.isPremium ? 1 : 0,
        data.latitude !== undefined && data.latitude !== null ? data.latitude : null,
        data.longitude !== undefined && data.longitude !== null ? data.longitude : null,
        data.coverImageUrl || null,
        id.toString(),
      ]
    );
  }

  async deleteTour(id: bigint): Promise<void> {
    await query(`UPDATE tours SET status = 'ARCHIVED' WHERE id = ?`, [id.toString()]);
  }

  async getOrCreateTourQr(tourId: bigint): Promise<string> {
    // Get tour info for QR code generation
    const tourRows = await query<any[]>(
      `SELECT t.id, t.vendor_id, t.slug FROM tours t WHERE t.id = ? LIMIT 1`,
      [tourId.toString()]
    );
    if (tourRows.length === 0) {
      throw new Error('Tour not found');
    }
    const tour = tourRows[0];

    // Deactivate existing Tour QR codes
    await query(
      `UPDATE qr_codes SET is_active = 0 WHERE tour_id = ? AND qr_type = 'TOUR'`,
      [tourId.toString()]
    );

    // Create new QR code
    const code = `VTA-TOUR-${String(tour.id).padStart(4, '0')}`;
    const targetUrl = `https://app.viettouraudio.vn/tour/${tour.slug}`;
    const imageUrl = `/qr/tour-${tour.id}.png`;

    await query(
      `INSERT INTO qr_codes (vendor_id, tour_id, code, qr_type, target_url, image_url, is_active)
       VALUES (?, ?, ?, 'TOUR', ?, ?, 1)
       ON DUPLICATE KEY UPDATE is_active = 1, target_url = VALUES(target_url), image_url = VALUES(image_url)`,
      [
        String(tour.vendor_id),
        tourId.toString(),
        code,
        targetUrl,
        imageUrl,
      ]
    );

    return code;
  }
}
