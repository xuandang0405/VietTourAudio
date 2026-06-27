import bcrypt from 'bcryptjs';
import { VendorRepository } from '../repositories/vendor.repository';
import { query } from '../lib/db';

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

function mapVendor(row: any): any {
  return {
    id: String(row.id),
    businessName: row.trade_name,
    legalName: row.legal_name,
    ownerEmail: row.contact_email,
    ownerDisplayName: row.contact_name,
    contactPhone: row.phone,
    address: row.address,
    verificationStatus: row.status,
    vendorCode: row.vendor_code,
    assignedTourId: row.assigned_tour_id ? String(row.assigned_tour_id) : null,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    wallet: row.wallet_id
      ? {
          id: String(row.wallet_id),
          balance: row.balance,
          totalTopUp: row.total_top_up,
        }
      : null,
    subscription: row.subscription_id
      ? {
          id: String(row.subscription_id),
          status: row.subscription_status,
          periodStart: row.period_start,
          periodEnd: row.period_end,
          plan: {
            id: row.plan_id == null ? null : String(row.plan_id),
            name: row.plan_name,
            monthlyPrice: row.plan_price,
          },
        }
      : null,
    stalls:
      row.stall_count == null
        ? []
        : Array.from({ length: Number(row.stall_count) }, (_item, index) => ({
            id: `${row.id}-${index + 1}`,
          })),
  };
}

function mapTransaction(tx: any) {
  return {
    id: String(tx.id),
    walletId: String(tx.wallet_id),
    type:
      tx.transaction_category === 'PREMIUM_UPGRADE'
        ? 'PREMIUM_UPGRADE'
        : tx.transaction_category === 'WEBAPP_MONTHLY_RENT'
        ? 'SUBSCRIPTION_FEE'
        : tx.transaction_type === 'MANUAL' && tx.direction === 'DEBIT'
        ? 'MANUAL_DEBIT'
        : tx.transaction_type === 'MANUAL'
        ? 'MANUAL_CREDIT'
        : 'TOP_UP',
    amount: tx.direction === 'DEBIT' ? `-${tx.amount}` : tx.amount,
    balanceAfter: tx.balance_after,
    description: tx.description,
    createdAt: tx.created_at,
  };
}

function mapTopUp(row: any) {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    amount: row.amount,
    provider: row.provider,
    status: row.status,
    proofImageUrl: row.proof_url,
    rejectReason: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMedia(row: any) {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    stallId: row.stall_id == null ? null : String(row.stall_id),
    poiId: row.poi_id == null ? null : String(row.poi_id),
    mediaType: row.file_type,
    storagePath: row.file_path,
    publicUrl: row.public_url,
    mimeType: row.mime_type,
    sizeBytes: row.file_size,
    moderationStatus: 'PENDING',
    createdAt: row.created_at,
  };
}

export class VendorService {
  private vendorRepo = new VendorRepository();

  async getVendors(status?: string, search?: string) {
    const where: string[] = [];
    const params: unknown[] = [];

    if (status && status !== 'ALL') {
      where.push('v.status = ?');
      params.push(status);
    }

    if (search) {
      where.push('(v.trade_name LIKE ? OR v.contact_email LIKE ? OR v.contact_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await this.vendorRepo.getVendors(whereClause, params);
    return rows.map(mapVendor);
  }

  async getToursList() {
    return this.vendorRepo.getToursList();
  }

  async createVendor(data: {
    tradeName: string;
    contactEmail: string;
    password?: string;
    vendorCode: string;
    assignedTourId: string | null;
  }) {
    if (!data.tradeName || !data.contactEmail || !data.password || !data.vendorCode) {
      throw new Error('Tên sạp, email, mật khẩu và mã vendor là bắt buộc.');
    }

    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(data.password, salt);
    const slug = slugify(data.tradeName);

    const vendorId = await this.vendorRepo.insertVendor({
      legalName: data.tradeName,
      tradeName: data.tradeName,
      slug,
      contactName: data.tradeName,
      contactEmail: data.contactEmail,
      vendorCode: data.vendorCode,
      assignedTourId: data.assignedTourId,
    });

    await this.vendorRepo.insertVendorPortalUser({
      vendorId,
      email: data.contactEmail,
      passHash,
      fullName: data.tradeName,
    });

    await this.vendorRepo.insertVendorWallet(vendorId);

    const row = await this.vendorRepo.getVendorRow(vendorId);
    return {
      vendorId,
      row,
      mapped: mapVendor(row),
    };
  }

  async getVendorDetail(id: bigint) {
    const row = await this.vendorRepo.getVendorRow(id);
    if (!row) {
      return null;
    }

    const [stalls, transactions, topUpRequests, mediaFiles] = await Promise.all([
      this.vendorRepo.getStallsByVendorId(id),
      this.vendorRepo.getWalletTransactionsByVendorId(id, 50),
      this.vendorRepo.getTopUpRequestsByVendorId(id, 20),
      this.vendorRepo.getMediaFilesByVendorId(id, 30),
    ]);

    const vendor = mapVendor(row);
    vendor.stalls = stalls.map((stall) => ({
      id: String(stall.id),
      name: stall.name,
      latitude: stall.latitude,
      longitude: stall.longitude,
      activationRadius: stall.activation_radius,
      status: stall.status,
      createdAt: stall.created_at,
      zoneCode: stall.zone_code,
      isPremium: Boolean(stall.is_premium),
    }));
    if (vendor.wallet) {
      vendor.wallet.transactions = transactions.map(mapTransaction);
    }
    vendor.topUpRequests = topUpRequests.map(mapTopUp);
    vendor.mediaFiles = mediaFiles.map(mapMedia);

    return vendor;
  }

  async approveVendor(id: bigint, userId: bigint) {
    const before = await this.vendorRepo.getVendorRow(id);
    if (!before) {
      throw new Error('Vendor not found');
    }

    await this.vendorRepo.updateVendorStatus(id, 'APPROVED', userId.toString());
    const after = await this.vendorRepo.getVendorRow(id);
    return {
      before,
      after,
      mappedAfter: mapVendor(after),
    };
  }

  async rejectVendor(id: bigint, reason: string) {
    const before = await this.vendorRepo.getVendorRow(id);
    if (!before) {
      throw new Error('Vendor not found');
    }

    await this.vendorRepo.updateVendorStatus(id, 'REJECTED', undefined, reason);
    await query(
      `UPDATE vendor_portal_users SET status = 'DISABLED' WHERE vendor_id = ?`,
      [id.toString()]
    );
    await query(
      `DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM vendor_portal_users WHERE vendor_id = ?)`,
      [id.toString()]
    );
    const after = await this.vendorRepo.getVendorRow(id);
    return {
      before,
      after,
      mappedAfter: mapVendor(after),
    };
  }

  async suspendVendor(id: bigint, reason: string) {
    const before = await this.vendorRepo.getVendorRow(id);
    if (!before) {
      throw new Error('Vendor not found');
    }

    await this.vendorRepo.updateVendorStatus(id, 'SUSPENDED');
    await this.vendorRepo.suspendStalls(id);
    await query(
      `UPDATE vendor_portal_users SET status = 'DISABLED' WHERE vendor_id = ?`,
      [id.toString()]
    );
    await query(
      `DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM vendor_portal_users WHERE vendor_id = ?)`,
      [id.toString()]
    );

    const after = await this.vendorRepo.getVendorRow(id);
    return {
      before,
      after,
      mappedAfter: mapVendor(after),
    };
  }

  async updateVendorStatus(id: bigint, status: string, reason?: string, userId?: bigint) {
    const before = await this.vendorRepo.getVendorRow(id);
    if (!before) {
      throw new Error('Vendor not found');
    }

    if (status === 'APPROVED') {
      return this.approveVendor(id, userId || BigInt(1));
    } else if (status === 'REJECTED') {
      return this.rejectVendor(id, reason || 'Rejected by admin');
    } else if (status === 'SUSPENDED') {
      return this.suspendVendor(id, reason || 'Suspended by admin');
    } else {
      await this.vendorRepo.updateVendorStatus(id, status as any);
      if (status === 'DISABLED' || status === 'PENDING') {
        await query(
          `UPDATE vendor_portal_users SET status = 'DISABLED' WHERE vendor_id = ?`,
          [id.toString()]
        );
        await query(
          `DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM vendor_portal_users WHERE vendor_id = ?)`,
          [id.toString()]
        );
      }
      const after = await this.vendorRepo.getVendorRow(id);
      return {
        before,
        after,
        mappedAfter: mapVendor(after),
      };
    }
  }

  async forceCancelVendor(id: bigint, reason: string) {
    const before = await this.vendorRepo.getVendorRow(id);
    if (!before) {
      throw new Error('Vendor not found');
    }

    await this.vendorRepo.updateVendorStatus(id, 'SUSPENDED');
    await this.vendorRepo.suspendStalls(id);
    await this.vendorRepo.cancelSubscriptions(id);
    await query(
      `UPDATE vendor_portal_users SET status = 'DISABLED' WHERE vendor_id = ?`,
      [id.toString()]
    );
    await query(
      `DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM vendor_portal_users WHERE vendor_id = ?)`,
      [id.toString()]
    );
    const after = await this.vendorRepo.getVendorRow(id);
    return {
      before,
      after,
      mappedAfter: mapVendor(after),
    };
  }

  async updateVendor(
    id: bigint,
    data: {
      legalName?: string;
      tradeName?: string;
      contactEmail?: string;
      vendorCode?: string;
      assignedTourId?: string | null;
    }
  ) {
    const before = await this.vendorRepo.getVendorRow(id);
    if (!before) {
      throw new Error('Vendor not found');
    }

    const slug = data.tradeName ? slugify(data.tradeName) : undefined;

    await this.vendorRepo.updateVendor(id, {
      legalName: data.legalName,
      tradeName: data.tradeName,
      slug,
      contactEmail: data.contactEmail,
      vendorCode: data.vendorCode,
      assignedTourId: data.assignedTourId,
    });

    const after = await this.vendorRepo.getVendorRow(id);
    return {
      before,
      after,
      mappedAfter: mapVendor(after),
    };
  }

  async unsuspendVendor(id: bigint) {
    const before = await this.vendorRepo.getVendorRow(id);
    if (!before) {
      throw new Error('Vendor not found');
    }

    await this.vendorRepo.updateVendorStatus(id, 'APPROVED');
    await query('UPDATE stalls SET status = ? WHERE vendor_id = ?', ['APPROVED', id.toString()]);
    await query(
      `UPDATE vendor_portal_users SET status = 'ACTIVE' WHERE vendor_id = ?`,
      [id.toString()]
    );

    const after = await this.vendorRepo.getVendorRow(id);
    return {
      before,
      after,
      mappedAfter: mapVendor(after),
    };
  }
}
