import { query } from '../lib/db';

export class ContentRepository {
  async getMediaQueue(status: string): Promise<any[]> {
    const isAll = status === 'ALL';
    return query<any[]>(
      `SELECT
         mf.*,
         v.trade_name,
         s.name AS stall_name,
         p.name AS poi_name
       FROM media_files mf
       LEFT JOIN vendors v ON v.id = mf.vendor_id
       LEFT JOIN stalls s ON s.id = mf.stall_id
       LEFT JOIN pois p ON p.id = mf.poi_id
       ${isAll ? '' : 'WHERE mf.moderation_status = ?'}
       ORDER BY mf.created_at ASC`,
      isAll ? [] : [status]
    );
  }

  async getMediaById(id: bigint): Promise<any | null> {
    const rows = await query<any[]>(
      `SELECT
         mf.*,
         v.trade_name,
         s.name AS stall_name,
         p.name AS poi_name
       FROM media_files mf
       LEFT JOIN vendors v ON v.id = mf.vendor_id
       LEFT JOIN stalls s ON s.id = mf.stall_id
       LEFT JOIN pois p ON p.id = mf.poi_id
       WHERE mf.id = ?
       LIMIT 1`,
      [id.toString()]
    );
    return rows[0] || null;
  }

  async updateModeration(id: bigint, status: 'APPROVED' | 'REJECTED' | 'HIDDEN', actorId: bigint, reason?: string | null): Promise<void> {
    await query(
      `UPDATE media_files
       SET moderation_status = ?, moderated_by_user_id = ?, moderated_at = NOW(), rejection_reason = ?
       WHERE id = ?`,
      [status, actorId.toString(), reason ?? null, id.toString()]
    );
  }

  async bulkApprove(ids: string[], actorId: bigint): Promise<void> {
    const placeholders = ids.map(() => '?').join(',');
    await query(
      `UPDATE media_files
       SET moderation_status = 'APPROVED', moderated_by_user_id = ?, moderated_at = NOW(), rejection_reason = NULL
       WHERE id IN (${placeholders})`,
      [actorId.toString(), ...ids]
    );
  }
}
