import { query } from '../lib/db';

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
}
