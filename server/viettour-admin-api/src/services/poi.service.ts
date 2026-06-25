import { PoiRepository, TourRepository } from '../repositories/poi.repository';
import { buildPoiZoneScope, buildStallZoneScope } from '../utils/zoneScope';

export class PoiService {
  private poiRepo = new PoiRepository();

  async getPoiRow(id: bigint, req?: any) {
    const zoneScope = req ? buildPoiZoneScope(req) : { clause: '', params: [] };
    return this.poiRepo.getPoiRow(id, zoneScope.clause, zoneScope.params);
  }

  async isStallAllowed(req: any, stallId: string) {
    const zoneScope = buildStallZoneScope(req);
    return this.poiRepo.isStallAllowed(stallId, zoneScope.clause, zoneScope.params);
  }

  async getAllPois(req: any) {
    const zoneScope = buildPoiZoneScope(req);
    const rows = await this.poiRepo.getAllPois(zoneScope.clause, zoneScope.params);
    return rows.map((row) => ({
      id: String(row.id),
      stallId: String(row.stall_id),
      stallName: row.stall_name || 'N/A',
      name: row.name,
      slug: row.slug,
      description: row.description,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      activationRadius: Number(row.activation_radius),
      isPremiumContent: Boolean(row.is_premium_content),
      status: row.status,
      sortOrder: Number(row.sort_order),
      contents: Number(row.contents_count),
      mediaFiles: Number(row.media_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getGuestPois(zoneCode: string, lang: string) {
    const rows = await this.poiRepo.getGuestPoisByZoneCode(zoneCode, lang);
    return rows.map((row) => ({
      id: String(row.id),
      stallId: String(row.stall_id),
      stallName: row.stall_name || 'N/A',
      name: row.name,
      slug: row.slug,
      description: row.description,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      activationRadius: Number(row.activation_radius),
      isPremium: Boolean(row.is_premium_content),
      status: row.status,
      sortOrder: Number(row.sort_order),
      languageCount: Number(row.language_count ?? 0),
      audioUrl: row.audio_url || row.audio_url_vi || null,
      audioUrlVi: row.audio_url_vi || null,
      tourId: row.tour_id ? String(row.tour_id) : null,
      tourSlug: row.tour_slug || null,
      zone_code: row.zone_code || null,
    }));
  }


  async getAllStalls(req: any) {
    const zoneScope = buildStallZoneScope(req);
    return this.poiRepo.getAllStalls(zoneScope.clause, zoneScope.params);
  }

  async getActiveZones() {
    return this.poiRepo.getActiveZones();
  }

  async getDistance(poi1Id: bigint, poi2Id: bigint, req: any) {
    const zoneScope1 = buildPoiZoneScope(req, 's1');
    const zoneScope2 = buildPoiZoneScope(req, 's2');
    return this.poiRepo.getDistanceSphere(
      poi1Id,
      poi2Id,
      zoneScope1.clause,
      zoneScope1.params,
      zoneScope2.clause,
      zoneScope2.params
    );
  }

  async createPoi(
    req: any,
    data: {
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
      translations?: any[];
    }
  ) {
    const allowed = await this.isStallAllowed(req, String(data.stallId));
    if (!allowed) {
      throw new Error('Stall is outside assigned zone');
    }

    const insertId = await this.poiRepo.insertPoi(data);
    const after = await this.getPoiRow(insertId, req);
    if (!after) {
      throw new Error('Failed to retrieve newly created POI');
    }

    return {
      id: String(after.id),
      stallId: String(after.stall_id),
      stallName: after.stall_name || 'N/A',
      name: after.name,
      slug: after.slug,
      description: after.description,
      latitude: Number(after.latitude),
      longitude: Number(after.longitude),
      activationRadius: Number(after.activation_radius),
      isPremiumContent: Boolean(after.is_premium_content),
      status: after.status,
      sortOrder: Number(after.sort_order),
      contents: 0,
      mediaFiles: 0,
      createdAt: after.created_at,
      updatedAt: after.updated_at,
    };
  }

  async updatePoi(
    id: bigint,
    req: any,
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
      translations?: any[];
    }
  ) {
    const before = await this.getPoiRow(id, req);
    if (!before) {
      throw new Error('POI not found');
    }

    const allowed = await this.isStallAllowed(req, String(data.stallId));
    if (!allowed) {
      throw new Error('Stall is outside assigned zone');
    }

    await this.poiRepo.updatePoi(id, data);
    const after = await this.getPoiRow(id, req);
    if (!after) {
      throw new Error('Failed to retrieve updated POI');
    }

    return {
      id: String(after.id),
      stallId: String(after.stall_id),
      stallName: after.stall_name || 'N/A',
      name: after.name,
      slug: after.slug,
      description: after.description,
      latitude: Number(after.latitude),
      longitude: Number(after.longitude),
      activationRadius: Number(after.activation_radius),
      isPremiumContent: Boolean(after.is_premium_content),
      status: after.status,
      sortOrder: Number(after.sort_order),
      createdAt: after.created_at,
      updatedAt: after.updated_at,
    };
  }

  async deletePoi(id: bigint, req: any) {
    const before = await this.getPoiRow(id, req);
    if (!before) {
      throw new Error('POI not found');
    }

    await this.poiRepo.deletePoi(id);
    const after = await this.getPoiRow(id, req);
    return { before, after };
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export class TourService {
  private tourRepo = new TourRepository();

  async getAllTours() {
    const rows = await this.tourRepo.getAllTours();
    return rows.map((row) => ({
      id: String(row.id),
      vendorId: String(row.vendor_id),
      vendorName: row.vendor_name || 'N/A',
      name: row.name,
      slug: row.slug,
      description: row.description,
      coverImageUrl: row.cover_image_url ?? null,
      latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
      longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
      status: row.status,
      sortOrder: Number(row.sort_order),
      isPremium: Boolean(row.is_premium),
      poiCount: Number(row.poi_count),
      qrCode: row.qr_code ?? null,
      qrImageUrl: row.qr_image_url ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getTourById(id: bigint) {
    const rows = await this.tourRepo.getTourById(id);
    if (!rows || rows.length === 0) throw new Error('Tour not found');
    const first = rows[0];

    const poiIds = rows
      .filter((row) => row.poi_id !== null && row.poi_id !== undefined)
      .map((row) => String(row.poi_id));

    const translationsMap: Record<string, any[]> = {};
    if (poiIds.length > 0) {
      const { query } = require('../lib/db');
      const uniquePoiIds = Array.from(new Set(poiIds));
      const placeholders = uniquePoiIds.map(() => '?').join(',');
      const translationRows = await query(
        `SELECT poi_id, lang, title, tts_script FROM poi_contents WHERE poi_id IN (${placeholders})`,
        uniquePoiIds
      );
      for (const t of translationRows) {
        const poiId = String(t.poi_id);
        if (!translationsMap[poiId]) {
          translationsMap[poiId] = [];
        }
        translationsMap[poiId].push({
          lang: t.lang,
          title: t.title,
          ttsScript: t.tts_script,
        });
      }
    }

    const pois = rows
      .filter((row) => row.poi_id !== null && row.poi_id !== undefined)
      .map((row) => {
        const pId = String(row.poi_id);
        return {
          id: pId,
          name: row.poi_name,
          latitude: Number(row.poi_latitude),
          longitude: Number(row.poi_longitude),
          activationRadius: row.activation_radius ? Number(row.activation_radius) : 25,
          status: row.poi_status ?? 'ACTIVE',
          stallName: row.stall_name || 'N/A',
          contents: row.contents_count ? Number(row.contents_count) : 0,
          mediaFiles: row.media_count ? Number(row.media_count) : 0,
          translations: translationsMap[pId] || [],
        };
      });

    // De-duplicate pois list if any
    const seenPoiIds = new Set();
    const uniquePois = [];
    for (const poi of pois) {
      if (!seenPoiIds.has(poi.id)) {
        seenPoiIds.add(poi.id);
        uniquePois.push(poi);
      }
    }

    return {
      id: String(first.id),
      vendorId: String(first.vendor_id),
      vendorName: first.vendor_name || 'N/A',
      name: first.name,
      slug: first.slug,
      description: first.description,
      coverImageUrl: first.cover_image_url ?? null,
      latitude: first.latitude !== null && first.latitude !== undefined ? Number(first.latitude) : null,
      longitude: first.longitude !== null && first.longitude !== undefined ? Number(first.longitude) : null,
      status: first.status,
      sortOrder: Number(first.sort_order),
      isPremium: Boolean(first.is_premium),
      poiCount: Number(first.poi_count),
      qrCode: first.qr_code ?? null,
      qrImageUrl: first.qr_image_url ?? null,
      createdAt: first.created_at,
      updatedAt: first.updated_at,
      pois: uniquePois,
    };
  }

  async createTour(data: {
    vendorId: number | string;
    name: string;
    slug?: string;
    description?: string | null;
    status?: string;
    isPremium?: boolean;
    latitude?: number | string | null;
    longitude?: number | string | null;
    coverImageUrl?: string | null;
  }) {
    const slug = data.slug && data.slug.trim() ? slugify(data.slug) : slugify(data.name);
    const { query } = require('../lib/db');
    const existing = await query("SELECT id FROM tours WHERE slug = ? AND status != 'ARCHIVED'", [slug]);
    if (existing.length > 0) {
      throw new Error('Mã khu vực (Zone code / Slug) đã được sử dụng. Vui lòng chọn mã khác.');
    }

    const insertId = await this.tourRepo.insertTour({ ...data, slug });
    return this.getTourById(insertId);
  }

  async updateTour(
    id: bigint,
    data: {
      vendorId: number | string;
      name: string;
      slug?: string;
      description?: string | null;
      status: string;
      isPremium: boolean;
      latitude?: number | string | null;
      longitude?: number | string | null;
      coverImageUrl?: string | null;
    }
  ) {
    const before = await this.tourRepo.getTourById(id);
    if (!before) throw new Error('Tour not found');

    const slug = data.slug && data.slug.trim() ? slugify(data.slug) : slugify(data.name);
    const { query } = require('../lib/db');
    const existing = await query("SELECT id FROM tours WHERE slug = ? AND id != ? AND status != 'ARCHIVED'", [slug, id.toString()]);
    if (existing.length > 0) {
      throw new Error('Mã khu vực (Zone code / Slug) đã được sử dụng. Vui lòng chọn mã khác.');
    }

    await this.tourRepo.updateTour(id, { ...data, slug });
    return this.getTourById(id);
  }

  async deleteTour(id: bigint) {
    const before = await this.tourRepo.getTourById(id);
    if (!before) throw new Error('Tour not found');
    await this.tourRepo.deleteTour(id);
    return { success: true };
  }

  async resetTourQr(id: bigint) {
    const code = await this.tourRepo.getOrCreateTourQr(id);
    return { qrCode: code };
  }
}

