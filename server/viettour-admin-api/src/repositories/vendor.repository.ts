import { query } from '../lib/db';

export class VendorRepository {
  async getVendorRow(id: bigint): Promise<any | null> {
    const rows = await query<any[]>(
      `SELECT
         v.*,
         vw.id AS wallet_id, vw.balance, vw.total_top_up,
         vs.id AS subscription_id, vs.status AS subscription_status, vs.period_start, vs.period_end,
         sp.id AS plan_id, sp.name AS plan_name, sp.price AS plan_price,
         (SELECT COUNT(*) FROM stalls s WHERE s.vendor_id = v.id) AS stall_count
       FROM vendors v
       LEFT JOIN vendor_wallets vw ON vw.vendor_id = v.id
       LEFT JOIN vendor_subscriptions vs ON vs.vendor_id = v.id
       LEFT JOIN subscription_plans sp ON sp.id = vs.plan_id
       WHERE v.id = ?
       LIMIT 1`,
      [id.toString()]
    );
    return rows[0] || null;
  }

  async getVendors(whereClause = '', params: unknown[] = []): Promise<any[]> {
    return query<any[]>(
      `SELECT
         v.*,
         vw.id AS wallet_id, vw.balance, vw.total_top_up,
         vs.id AS subscription_id, vs.status AS subscription_status, vs.period_start, vs.period_end,
         sp.id AS plan_id, sp.name AS plan_name, sp.price AS plan_price,
         (SELECT COUNT(*) FROM stalls s WHERE s.vendor_id = v.id) AS stall_count
       FROM vendors v
       LEFT JOIN vendor_wallets vw ON vw.vendor_id = v.id
       LEFT JOIN vendor_subscriptions vs ON vs.vendor_id = v.id
       LEFT JOIN subscription_plans sp ON sp.id = vs.plan_id
       ${whereClause}
       ORDER BY v.created_at DESC`,
      params
    );
  }

  async getToursList(): Promise<{ id: string; name: string }[]> {
    const rows = await query<any[]>('SELECT id, name FROM tours ORDER BY name ASC');
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
    }));
  }

  async insertVendor(data: {
    legalName: string;
    tradeName: string;
    slug: string;
    contactName: string;
    contactEmail: string;
    vendorCode: string;
    assignedTourId: string | null;
  }): Promise<bigint> {
    const result = await query<any>(
      `INSERT INTO vendors (legal_name, trade_name, slug, contact_name, contact_email, status, vendor_code, assigned_tour_id)
       VALUES (?, ?, ?, ?, ?, 'APPROVED', ?, ?)`,
      [
        data.legalName,
        data.tradeName,
        data.slug,
        data.contactName,
        data.contactEmail,
        data.vendorCode,
        data.assignedTourId,
      ]
    );
    return BigInt(result.insertId);
  }

  async insertVendorPortalUser(data: {
    vendorId: bigint;
    email: string;
    passHash: string;
    fullName: string;
  }): Promise<void> {
    await query(
      `INSERT INTO vendor_portal_users (vendor_id, email, pass_hash, full_name, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [data.vendorId.toString(), data.email, data.passHash, data.fullName]
    );
  }

  async insertVendorWallet(vendorId: bigint): Promise<void> {
    await query(
      `INSERT INTO vendor_wallets (vendor_id, balance, total_top_up, total_spent, total_commission)
       VALUES (?, 0, 0, 0, 0)`,
      [vendorId.toString()]
    );
  }

  async getStallsByVendorId(vendorId: bigint): Promise<any[]> {
    return query<any[]>('SELECT * FROM stalls WHERE vendor_id = ? ORDER BY created_at DESC', [vendorId.toString()]);
  }

  async getWalletTransactionsByVendorId(vendorId: bigint, limit = 50): Promise<any[]> {
    return query<any[]>(
      `SELECT wt.* FROM wallet_transactions wt
       JOIN vendor_wallets vw ON vw.id = wt.wallet_id
       WHERE vw.vendor_id = ?
       ORDER BY wt.created_at DESC
       LIMIT ?`,
      [vendorId.toString(), limit]
    );
  }

  async getTopUpRequestsByVendorId(vendorId: bigint, limit = 20): Promise<any[]> {
    return query<any[]>('SELECT * FROM top_up_requests WHERE vendor_id = ? ORDER BY created_at DESC LIMIT ?', [
      vendorId.toString(),
      limit,
    ]);
  }

  async getMediaFilesByVendorId(vendorId: bigint, limit = 30): Promise<any[]> {
    return query<any[]>('SELECT * FROM media_files WHERE vendor_id = ? ORDER BY created_at DESC LIMIT ?', [
      vendorId.toString(),
      limit,
    ]);
  }

  async updateVendorStatus(id: bigint, status: string, approvedByUserId?: string, rejectionReason?: string | null): Promise<void> {
    if (status === 'APPROVED' && approvedByUserId) {
      await query(
        'UPDATE vendors SET status = ?, rejection_reason = NULL, approved_by_user_id = ?, approved_at = NOW() WHERE id = ?',
        [status, approvedByUserId, id.toString()]
      );
    } else {
      await query('UPDATE vendors SET status = ?, rejection_reason = ? WHERE id = ?', [
        status,
        rejectionReason ?? null,
        id.toString(),
      ]);
    }
  }

  async suspendStalls(vendorId: bigint): Promise<void> {
    await query('UPDATE stalls SET status = ? WHERE vendor_id = ?', ['SUSPENDED', vendorId.toString()]);
  }

  async cancelSubscriptions(vendorId: bigint): Promise<void> {
    await query('UPDATE vendor_subscriptions SET status = ? WHERE vendor_id = ?', ['CANCELLED', vendorId.toString()]);
  }

  async updateVendor(
    id: bigint,
    data: {
      legalName?: string;
      tradeName?: string;
      slug?: string;
      contactEmail?: string;
      vendorCode?: string;
      assignedTourId?: string | null;
    }
  ): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (data.legalName !== undefined) {
      fields.push('legal_name = ?');
      params.push(data.legalName);
    }
    if (data.tradeName !== undefined) {
      fields.push('trade_name = ?');
      params.push(data.tradeName);
    }
    if (data.slug !== undefined) {
      fields.push('slug = ?');
      params.push(data.slug);
    }
    if (data.contactEmail !== undefined) {
      fields.push('contact_email = ?');
      params.push(data.contactEmail);
    }
    if (data.vendorCode !== undefined) {
      fields.push('vendor_code = ?');
      params.push(data.vendorCode);
    }
    if (data.assignedTourId !== undefined) {
      fields.push('assigned_tour_id = ?');
      params.push(data.assignedTourId);
    }

    if (fields.length === 0) return;

    params.push(id.toString());
    await query(`UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`, params);

    if (data.contactEmail !== undefined) {
      await query(
        'UPDATE vendor_portal_users SET email = ? WHERE vendor_id = ?',
        [data.contactEmail, id.toString()]
      );
    }
  }
}
