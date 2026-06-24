import { query } from '../lib/db';

export class UserRepository {
  async getZoneByIdAndActive(zoneId: string): Promise<any | null> {
    const rows = await query<any[]>('SELECT id FROM zones WHERE id = ? AND is_active = 1 LIMIT 1', [zoneId]);
    return rows[0] || null;
  }

  async insertUser(data: {
    email: string;
    passHash: string;
    fullName: string;
    role: string;
    assignedZoneId: string | null;
  }): Promise<bigint> {
    const result = await query<any>(
      `INSERT INTO users (email, pass_hash, full_name, role, assigned_zone_id, status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [data.email, data.passHash, data.fullName, data.role, data.assignedZoneId]
    );
    return BigInt(result.insertId);
  }

  async getUserDetails(id: bigint): Promise<any | null> {
    const rows = await query<any[]>(
      `SELECT u.id, u.email, u.full_name, u.role, u.assigned_zone_id, u.status, u.created_at, z.name AS zone_name
       FROM users u
       LEFT JOIN zones z ON z.id = u.assigned_zone_id
       WHERE u.id = ?
       LIMIT 1`,
      [id.toString()]
    );
    return rows[0] || null;
  }
}
