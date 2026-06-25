import { query, pool } from '../lib/db';
import { translateDynamicFields } from '../utils/translator';

export class StallRepository {
  async getStallById(id: bigint, zoneScopeClause = '', zoneScopeParams: unknown[] = []): Promise<any | null> {
    const rows = await query<any[]>(
      `SELECT id, name, zone_code FROM stalls s WHERE id = ? ${zoneScopeClause} LIMIT 1`,
      [id.toString(), ...zoneScopeParams]
    );
    return rows[0] || null;
  }

  async updateStallZoneCode(id: bigint, newCode: string): Promise<void> {
    await query(
      'UPDATE stalls SET zone_code = ?, updated_at = NOW() WHERE id = ?',
      [newCode, id.toString()]
    );
  }

  async insertStall(data: {
    vendorId: number | string;
    name: string;
    slug: string;
    description?: string | null;
    address?: string | null;
    latitude?: number;
    longitude?: number;
    activationRadius?: number;
    openingHours?: string | null;
    isFeatured?: boolean;
    isPremium?: boolean;
    priorityScore?: number;
    status?: string;
    zoneCode?: string | null;
  }): Promise<bigint> {
    const vendorId = BigInt(data.vendorId).toString();

    // 1. Fetch dynamic translations concurrently in the background first (outside transaction block)
    let transMap: Record<string, { title: string; description: string }> = {};
    try {
      transMap = await translateDynamicFields({
        title: data.name,
        description: data.description || '',
      });
    } catch (err: any) {
      console.error('Dynamic background Stall translation helper failed:', err.message);
    }

    // 2. Open transaction and insert all variants into database
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [resultStall] = await connection.execute<any>(
        `INSERT INTO stalls (vendor_id, name, slug, description, address, latitude, longitude, activation_radius, status, opening_hours, is_featured, is_premium, priority_score, zone_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vendorId,
          data.name,
          data.slug,
          data.description || null,
          data.address || null,
          data.latitude ?? 10.7740,
          data.longitude ?? 106.7030,
          data.activationRadius ?? 3,
          data.status || 'PENDING',
          data.openingHours || null,
          data.isFeatured ? 1 : 0,
          data.isPremium ? 1 : 0,
          data.priorityScore ?? 0,
          data.zoneCode || null,
        ]
      );
      const stallId = resultStall.insertId;

      // Insert 'vi' content
      await connection.execute(
        `INSERT INTO stall_contents (stall_id, lang, name, description)
         VALUES (?, 'vi', ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
        [
          stallId.toString(),
          data.name,
          data.description || '',
        ]
      );

      // Insert other translations
      for (const lang of ['en', 'ja', 'ko', 'zh']) {
        const trans = transMap[lang] || { title: '', description: '' };
        await connection.execute(
          `INSERT INTO stall_contents (stall_id, lang, name, description)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
          [
            stallId.toString(),
            lang,
            trans.title || data.name,
            trans.description || data.description || '',
          ]
        );
      }

      await connection.commit();
      return BigInt(stallId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
