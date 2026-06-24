import { AuditRepository } from '../repositories/audit.repository';

export class AuditService {
  private auditRepo = new AuditRepository();

  async getAuditLogs() {
    const rows = await this.auditRepo.getAuditLogs();
    return rows.map((row) => ({
      id: String(row.id),
      actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
      performedById: row.actor_user_id ? String(row.actor_user_id) : null,
      performedBy: row.actor_email || `User #${row.actor_user_id}` || 'System/Guest',
      actorName: row.actor_name || 'System/Guest',
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id ? String(row.target_id) : null,
      targetLabel: row.target_type + ' #' + row.target_id,
      beforeData: row.before_data ? (typeof row.before_data === 'string' ? JSON.parse(row.before_data) : row.before_data) : null,
      afterData: row.after_data ? (typeof row.after_data === 'string' ? JSON.parse(row.after_data) : row.after_data) : null,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      reason: row.reason || null,
      createdAt: row.created_at,
    }));
  }
}
