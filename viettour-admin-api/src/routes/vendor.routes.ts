import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';
import { requireReason, optionalReason, toBigIntId } from '../utils/serialization';

export const router = Router();

const vendorManagers = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate);

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
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    wallet: row.wallet_id
      ? {
          id: String(row.wallet_id),
          balance: row.balance,
          totalTopUp: row.total_top_up
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
            monthlyPrice: row.plan_price
          }
        }
      : null,
    stalls: row.stall_count == null ? [] : Array.from({ length: Number(row.stall_count) }, (_item, index) => ({ id: `${row.id}-${index + 1}` }))
  };
}

async function getVendorRow(id: bigint) {
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
  return rows[0];
}

router.get(
  '/',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'ALL';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
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
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY v.created_at DESC`,
      params
    );

    res.json(ok(rows.map(mapVendor)));
  })
);

router.get(
  '/tours-list',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const rows = await query<any[]>('SELECT id, name FROM tours ORDER BY name ASC');
    res.json(
      ok(
        rows.map((row) => ({
          id: String(row.id),
          name: row.name
        }))
      )
    );
  })
);

router.post(
  '/',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const { tradeName, contactEmail, password, vendorCode, assignedTourId } = req.body;

    if (!tradeName || !contactEmail || !password || !vendorCode) {
      res.status(400).json({ success: false, error: 'Tên sạp, email, mật khẩu và mã vendor là bắt buộc.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(password, salt);
    const slug = slugify(tradeName);

    const vendorResult = await query<any>(
      `INSERT INTO vendors (legal_name, trade_name, slug, contact_name, contact_email, status, vendor_code, assigned_tour_id)
       VALUES (?, ?, ?, ?, ?, 'APPROVED', ?, ?)`,
      [
        tradeName,
        tradeName,
        slug,
        tradeName,
        contactEmail,
        vendorCode,
        assignedTourId ? assignedTourId.toString() : null
      ]
    );

    const vendorId = vendorResult.insertId;

    await query(
      `INSERT INTO vendor_portal_users (vendor_id, email, pass_hash, full_name, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [
        vendorId.toString(),
        contactEmail,
        passHash,
        tradeName
      ]
    );

    await query(
      `INSERT INTO vendor_wallets (vendor_id, balance, total_top_up, total_spent, total_commission)
       VALUES (?, 0, 0, 0, 0)`,
      [vendorId.toString()]
    );

    const row = await getVendorRow(BigInt(vendorId));

    req.auditMeta = {
      action: 'CREATE_VENDOR_ACCOUNT',
      targetType: 'vendors',
      targetId: BigInt(vendorId),
      beforeData: null,
      afterData: row
    };

    res.json(ok(mapVendor(row)));
  })
);

router.get(
  '/:id',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const row = await getVendorRow(id);

    if (!row) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    const [stalls, transactions, topUpRequests, mediaFiles] = await Promise.all([
      query<any[]>('SELECT * FROM stalls WHERE vendor_id = ? ORDER BY created_at DESC', [id.toString()]),
      query<any[]>(
        `SELECT wt.* FROM wallet_transactions wt
         JOIN vendor_wallets vw ON vw.id = wt.wallet_id
         WHERE vw.vendor_id = ?
         ORDER BY wt.created_at DESC
         LIMIT 50`,
        [id.toString()]
      ),
      query<any[]>('SELECT * FROM top_up_requests WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 20', [id.toString()]),
      query<any[]>('SELECT * FROM media_files WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 30', [id.toString()])
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
      zoneCode: stall.zone_code
    }));
    if (vendor.wallet) {
      vendor.wallet.transactions = transactions.map(mapTransaction);
    }
    vendor.topUpRequests = topUpRequests.map(mapTopUp);
    vendor.mediaFiles = mediaFiles.map(mapMedia);

    res.json(ok(vendor));
  })
);

router.post(
  '/:id/approve',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'vendor id');
    const before = await getVendorRow(id);
    if (!before) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    await query('UPDATE vendors SET status = ?, rejection_reason = NULL, approved_by_user_id = ?, approved_at = NOW() WHERE id = ?', [
      'APPROVED',
      req.user!.userId.toString(),
      id.toString()
    ]);

    const after = await getVendorRow(id);
    req.auditMeta = {
      action: 'APPROVE_VENDOR',
      targetType: 'vendors',
      targetId: id,
      beforeData: before,
      afterData: after
    };

    res.json(ok(mapVendor(after)));
  })
);

router.post(
  '/:id/reject',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const reason = optionalReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'vendor id');
    const before = await getVendorRow(id);
    if (!before) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    await query('UPDATE vendors SET status = ?, rejection_reason = ? WHERE id = ?', ['REJECTED', reason, id.toString()]);
    const after = await getVendorRow(id);
    req.auditMeta = {
      action: 'REJECT_VENDOR',
      targetType: 'vendors',
      targetId: id,
      reason,
      beforeData: before,
      afterData: after
    };

    res.json(ok(mapVendor(after)));
  })
);

router.post(
  '/:id/suspend',
  authorize(...vendorManagers),
  asyncHandler(async (req, res) => {
    const reason = requireReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'vendor id');
    const before = await getVendorRow(id);
    if (!before) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    await query('UPDATE vendors SET status = ? WHERE id = ?', ['SUSPENDED', id.toString()]);
    await query('UPDATE stalls SET status = ? WHERE vendor_id = ?', ['SUSPENDED', id.toString()]);
    const after = await getVendorRow(id);
    req.auditMeta = {
      action: 'SUSPEND_VENDOR',
      targetType: 'vendors',
      targetId: id,
      reason,
      beforeData: before,
      afterData: after
    };

    res.json(ok(mapVendor(after)));
  })
);

router.post(
  '/:id/force-cancel',
  authorize(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const reason = requireReason(req.body.reason);
    const id = toBigIntId(req.params.id, 'vendor id');
    const before = await getVendorRow(id);
    if (!before) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    await query('UPDATE vendors SET status = ? WHERE id = ?', ['SUSPENDED', id.toString()]);
    await query('UPDATE stalls SET status = ? WHERE vendor_id = ?', ['SUSPENDED', id.toString()]);
    await query('UPDATE vendor_subscriptions SET status = ? WHERE vendor_id = ?', ['CANCELLED', id.toString()]);
    const after = await getVendorRow(id);
    req.auditMeta = {
      action: 'FORCE_CANCEL_VENDOR',
      targetType: 'vendors',
      targetId: id,
      reason,
      beforeData: before,
      afterData: after
    };

    res.json(ok(mapVendor(after)));
  })
);

function mapTransaction(tx: any) {
  return {
    id: String(tx.id),
    walletId: String(tx.wallet_id),
    type: tx.transaction_type === 'FEE' ? 'SUBSCRIPTION_FEE' : tx.transaction_type === 'MANUAL' && tx.direction === 'DEBIT' ? 'MANUAL_DEBIT' : tx.transaction_type === 'MANUAL' ? 'MANUAL_CREDIT' : 'TOP_UP',
    amount: tx.direction === 'DEBIT' ? `-${tx.amount}` : tx.amount,
    balanceAfter: tx.balance_after,
    description: tx.description,
    createdAt: tx.created_at
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
    updatedAt: row.updated_at
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
    createdAt: row.created_at
  };
}

export default router;
