import { query } from '../lib/db';
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
  }): Promise<bigint> {
    const result = await query<any>(
      `INSERT INTO zones (tour_id, stall_id, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        data.tourId,
        data.stallId,
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
    return BigInt(result.insertId);
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
    }
  ): Promise<void> {
    await query(
      `UPDATE zones
       SET tour_id = ?, stall_id = ?, name = ?, slug = ?, description = ?, latitude = ?, longitude = ?, activation_radius = ?, is_premium_content = ?, status = ?
       WHERE id = ?`,
      [
        data.tourId,
        data.stallId,
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
  }

  async deletePoi(id: bigint): Promise<void> {
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

  async getTourById(id: bigint): Promise<any | null> {
    const rows = await query<any[]>(
      `SELECT t.*,
              v.trade_name AS vendor_name,
              (SELECT COUNT(*) FROM zones z WHERE z.tour_id = t.id AND z.status != 'HIDDEN') AS poi_count,
              (SELECT qr.code FROM qr_codes qr WHERE qr.tour_id = t.id AND qr.qr_type = 'TOUR' AND qr.is_active = 1 LIMIT 1) AS qr_code,
              (SELECT qr.image_url FROM qr_codes qr WHERE qr.tour_id = t.id AND qr.qr_type = 'TOUR' AND qr.is_active = 1 LIMIT 1) AS qr_image_url
       FROM tours t
       LEFT JOIN vendors v ON v.id = t.vendor_id
       WHERE t.id = ?
       LIMIT 1`,
      [id.toString()]
    );
    return rows[0] || null;
  }

  async insertTour(data: {
    vendorId: number | string;
    name: string;
    slug: string;
    description?: string | null;
    status?: string;
    isPremium?: boolean;
  }): Promise<bigint> {
    const result = await query<any>(
      `INSERT INTO tours (vendor_id, name, slug, description, status, is_premium, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [
        data.vendorId,
        data.name,
        data.slug,
        data.description || null,
        data.status || 'DRAFT',
        data.isPremium ? 1 : 0,
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
    }
  ): Promise<void> {
    await query(
      `UPDATE tours SET vendor_id = ?, name = ?, slug = ?, description = ?, status = ?, is_premium = ?
       WHERE id = ?`,
      [
        data.vendorId,
        data.name,
        data.slug,
        data.description || null,
        data.status,
        data.isPremium ? 1 : 0,
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
