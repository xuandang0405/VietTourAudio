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
    const row = await this.tourRepo.getTourById(id);
    if (!row) throw new Error('Tour not found');
    return {
      id: String(row.id),
      vendorId: String(row.vendor_id),
      vendorName: row.vendor_name || 'N/A',
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status,
      sortOrder: Number(row.sort_order),
      isPremium: Boolean(row.is_premium),
      poiCount: Number(row.poi_count),
      qrCode: row.qr_code ?? null,
      qrImageUrl: row.qr_image_url ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createTour(data: {
    vendorId: number | string;
    name: string;
    description?: string | null;
    status?: string;
    isPremium?: boolean;
  }) {
    const slug = slugify(data.name);
    const insertId = await this.tourRepo.insertTour({ ...data, slug });
    return this.getTourById(insertId);
  }

  async updateTour(
    id: bigint,
    data: {
      vendorId: number | string;
      name: string;
      description?: string | null;
      status: string;
      isPremium: boolean;
    }
  ) {
    const before = await this.tourRepo.getTourById(id);
    if (!before) throw new Error('Tour not found');

    const slug = slugify(data.name);
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

