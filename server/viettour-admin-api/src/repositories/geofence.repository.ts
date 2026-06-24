import { query } from '../lib/db';

export class GeofenceRepository {
  async getStallsWithVendors(zoneScopeClause = '', zoneScopeParams: unknown[] = []): Promise<any[]> {
    const rows = await query<any[]>(
      `SELECT
         s.*,
         v.trade_name, v.contact_email
       FROM stalls s
       JOIN vendors v ON v.id = s.vendor_id
       WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
       ${zoneScopeClause}
       ORDER BY s.updated_at DESC`,
      zoneScopeParams
    );
    return rows;
  }

  async getPoisWithStalls(zoneScopeClause = '', zoneScopeParams: unknown[] = []): Promise<any[]> {
    const rows = await query<any[]>(
      `SELECT p.*, s.name AS stall_name
       FROM zones p
       LEFT JOIN stalls s ON s.id = p.stall_id
       WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND p.status != 'HIDDEN'
       ${zoneScopeClause}`,
      zoneScopeParams
    );
    return rows;
  }

  async getActiveTours(): Promise<any[]> {
    return query<any[]>('SELECT * FROM tours WHERE status != \'ARCHIVED\'');
  }

  async getTourPois(): Promise<any[]> {
    return query<any[]>(
      `SELECT z.tour_id, z.id AS poi_id, z.latitude, z.longitude, z.name AS poi_name
       FROM zones z
       WHERE z.latitude IS NOT NULL AND z.longitude IS NOT NULL AND z.status = 'ACTIVE'`
    );
  }
}
