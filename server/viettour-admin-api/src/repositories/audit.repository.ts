import { query } from '../lib/db';

export class AuditRepository {
  async getAuditLogs(): Promise<any[]> {
    return query<any[]>(
      `SELECT al.*, u.email AS actor_email, u.full_name AS actor_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_user_id
       ORDER BY al.created_at DESC`
    );
  }
}
