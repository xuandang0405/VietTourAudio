import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { query } from '../lib/db';
import { UserRole } from '../types/domain';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';
import { chargeMonthlyRent, upgradeVendorToPremium } from '../services/vendor-wallet.service';

export const router = Router();

router.use(authenticate, authorize(UserRole.VENDOR));

const uploadDirectory = path.join(__dirname, '../../uploads/vendor');
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedImageTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename(req, file, callback) {
      const vendorId = req.user?.vendorId?.toString() ?? 'unknown';
      callback(null, `vendor-${vendorId}-${Date.now()}-${crypto.randomUUID()}${allowedImageTypes[file.mimetype] ?? ''}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!allowedImageTypes[file.mimetype]) {
      callback(Object.assign(new Error('Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF.'), { statusCode: 400 }));
      return;
    }
    callback(null, true);
  }
});

async function isValidImageFile(filePath: string, mimeType: string) {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, buffer.length, 0);
    if (mimeType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimeType === 'image/gif') return buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a';
    if (mimeType === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    return false;
  } finally {
    await handle.close();
  }
}

async function removeUploadedFile(file?: Express.Multer.File) {
  if (file) await fs.promises.unlink(file.path).catch(() => undefined);
}

function getVendorId(vendorId: bigint | undefined) {
  if (!vendorId) {
    throw Object.assign(new Error('Vendor context is missing'), { statusCode: 401 });
  }

  return vendorId.toString();
}

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);

    const [vendorRows, metricRows, dailyRows, poiRows] = await Promise.all([
      query<any[]>(
        `SELECT
           v.id,
           v.trade_name,
           v.contact_name,
           v.contact_email,
           v.status,
           vw.balance,
           vw.total_top_up,
           vw.total_spent,
           vw.total_commission,
           vs.status AS subscription_status,
           vs.period_end,
           vs.next_billing_date,
           vs.payment_status,
           vs.price_snapshot,
           sp.name AS plan_name
         FROM vendors v
         LEFT JOIN vendor_wallets vw ON vw.vendor_id = v.id
         LEFT JOIN vendor_subscriptions vs ON vs.vendor_id = v.id
         LEFT JOIN subscription_plans sp ON sp.id = vs.plan_id
         WHERE v.id = ?
         ORDER BY vs.id DESC
         LIMIT 1`,
        [vendorId]
      ),
      query<any[]>(
        `SELECT
           (SELECT COUNT(*) FROM zones p JOIN stalls s ON s.id = p.stall_id WHERE s.vendor_id = ?) AS total_pois,
           (SELECT COALESCE(SUM(qr_scans), 0) FROM analytics_daily_stall WHERE vendor_id = ?) AS total_qr_scans,
           (SELECT COALESCE(SUM(visits), 0) FROM analytics_daily_stall WHERE vendor_id = ?) AS total_visits,
           (SELECT COALESCE(SUM(audio_plays), 0) FROM analytics_daily_stall WHERE vendor_id = ?) AS total_audio_plays,
           (SELECT COALESCE(SUM(unique_visitors), 0) FROM analytics_daily_stall WHERE vendor_id = ?) AS total_unique_visitors,
           (SELECT COALESCE(SUM(premium_conversions), 0) FROM analytics_daily_stall WHERE vendor_id = ?) AS total_premium_conversions,
           (SELECT COALESCE(SUM(total_revenue), 0) FROM analytics_daily_stall WHERE vendor_id = ?) AS total_revenue`,
        [vendorId, vendorId, vendorId, vendorId, vendorId, vendorId, vendorId]
      ),
      query<any[]>(
        `SELECT
           date,
           COALESCE(SUM(visits), 0) AS visitors,
           COALESCE(SUM(audio_plays), 0) AS audio_plays,
           COALESCE(SUM(total_revenue), 0) AS revenue
         FROM analytics_daily_stall
         WHERE vendor_id = ?
         GROUP BY date
         ORDER BY date ASC`,
        [vendorId]
      ),
      query<any[]>(
        `SELECT
           p.id,
           p.name,
           p.status,
           p.is_premium_content,
           s.name AS stall_name,
           COALESCE(play_stats.audio_plays, 0) AS audio_plays,
           COALESCE(visit_stats.visits, 0) AS visits
         FROM zones p
         JOIN stalls s ON s.id = p.stall_id
         LEFT JOIN (
           SELECT poi_id, COUNT(*) AS audio_plays
           FROM play_history
           WHERE poi_id IS NOT NULL
           GROUP BY poi_id
         ) play_stats ON play_stats.poi_id = p.id
         LEFT JOIN (
           SELECT poi_id, COUNT(*) AS visits
           FROM visit_events
           WHERE poi_id IS NOT NULL
           GROUP BY poi_id
         ) visit_stats ON visit_stats.poi_id = p.id
         WHERE s.vendor_id = ?
         ORDER BY audio_plays DESC, visits DESC, p.sort_order ASC, p.id ASC
         LIMIT 5`,
        [vendorId]
      )
    ]);

    const vendor = vendorRows[0];
    const metrics = metricRows[0] ?? {};

    res.json(
      ok({
        vendor: vendor
          ? {
              id: String(vendor.id),
              businessName: vendor.trade_name,
              ownerDisplayName: vendor.contact_name,
              ownerEmail: vendor.contact_email,
              status: vendor.status,
              walletBalance: vendor.balance ?? '0.00',
              totalTopUp: vendor.total_top_up ?? '0.00',
              totalSpent: vendor.total_spent ?? '0.00',
              totalCommission: vendor.total_commission ?? '0.00',
              subscriptionStatus: vendor.subscription_status,
              subscriptionPlan: vendor.plan_name,
              subscriptionPeriodEnd: vendor.period_end,
              nextBillingDate: vendor.next_billing_date,
              paymentStatus: vendor.payment_status,
              subscriptionPrice: vendor.price_snapshot
            }
          : null,
        metrics: {
          totalPois: Number(metrics.total_pois ?? 0),
          totalQrScans: Number(metrics.total_qr_scans ?? 0),
          totalVisits: Number(metrics.total_visits ?? 0),
          totalAudioPlays: Number(metrics.total_audio_plays ?? 0),
          totalUniqueVisitors: Number(metrics.total_unique_visitors ?? 0),
          totalPremiumConversions: Number(metrics.total_premium_conversions ?? 0),
          totalRevenue: metrics.total_revenue ?? '0.00'
        },
        daily: dailyRows.map((row) => ({
          date: row.date,
          visitors: Number(row.visitors ?? 0),
          audioPlays: Number(row.audio_plays ?? 0),
          revenue: row.revenue ?? '0.00'
        })),
        topPois: poiRows.map((row) => ({
          id: String(row.id),
          name: row.name,
          stallName: row.stall_name,
          status: row.status,
          isPremiumContent: Boolean(row.is_premium_content),
          audioPlays: Number(row.audio_plays ?? 0),
          visits: Number(row.visits ?? 0)
        }))
      })
    );
  })
);

router.get(
  '/pois',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const rows = await query<any[]>(
      `SELECT
         p.id,
         p.name,
         p.slug,
         p.description,
         p.status,
         p.sort_order,
         p.is_premium_content,
         p.pending_name,
         p.pending_description,
         p.pending_cover_image_url,
         p.approval_status,
         s.name AS stall_name,
         (SELECT COUNT(DISTINCT pc.lang) FROM poi_contents pc WHERE pc.poi_id = p.id) AS language_count,
         (SELECT COUNT(*) FROM play_history ph WHERE ph.poi_id = p.id) AS audio_plays,
         (SELECT mf.public_url FROM media_files mf WHERE mf.poi_id = p.id AND mf.file_type = 'IMAGE' ORDER BY mf.id ASC LIMIT 1) AS image_url
       FROM zones p
       JOIN stalls s ON s.id = p.stall_id
       WHERE s.vendor_id = ?
       ORDER BY s.name ASC, p.sort_order ASC, p.id ASC`,
      [vendorId]
    );

    res.json(
      ok({
        pois: rows.map((row) => ({
          id: String(row.id),
          name: row.name,
          slug: row.slug,
          description: row.description,
          status: row.status,
          sortOrder: Number(row.sort_order ?? 0),
          isPremiumContent: Boolean(row.is_premium_content),
          stallName: row.stall_name,
          languageCount: Number(row.language_count ?? 0),
          audioPlays: Number(row.audio_plays ?? 0),
          imageUrl: row.image_url,
          pendingName: row.pending_name,
          pendingDescription: row.pending_description,
          pendingCoverImageUrl: row.pending_cover_image_url,
          approvalStatus: row.approval_status
        }))
      })
    );
  })
);

router.get(
  '/revenue',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const [walletRows, commissionRows, timelineRows, transactionRows, topUpRows, payoutRows] = await Promise.all([
      query<any[]>(
        `SELECT balance, total_top_up, total_spent, total_commission
         FROM vendor_wallets
         WHERE vendor_id = ?
         LIMIT 1`,
        [vendorId]
      ),
      query<any[]>(
        `SELECT
           COALESCE(SUM(CASE WHEN status = 'PENDING' THEN commission_amount ELSE 0 END), 0) AS pending_commission,
           COALESCE(SUM(CASE WHEN status IN ('APPROVED', 'PAID') THEN commission_amount ELSE 0 END), 0) AS approved_commission
         FROM commission_earnings
         WHERE vendor_id = ?`,
        [vendorId]
      ),
      query<any[]>(
        `SELECT
           date,
           COALESCE(SUM(total_revenue), 0) AS revenue,
           COALESCE(SUM(audio_plays), 0) AS audio_plays,
           COALESCE(SUM(visits), 0) AS visits
         FROM analytics_daily_stall
         WHERE vendor_id = ?
         GROUP BY date
         ORDER BY date ASC`,
        [vendorId]
      ),
      query<any[]>(
        `SELECT *
         FROM wallet_transactions
         WHERE vendor_id = ?
         ORDER BY created_at DESC
         LIMIT 20`,
        [vendorId]
      ),
      query<any[]>(
        `SELECT *
         FROM top_up_requests
         WHERE vendor_id = ?
         ORDER BY created_at DESC
         LIMIT 20`,
        [vendorId]
      ),
      query<any[]>(
        `SELECT *
         FROM commission_earnings
         WHERE vendor_id = ?
         ORDER BY earned_at DESC
         LIMIT 20`,
        [vendorId]
      )
    ]);

     const wallet = walletRows[0] ?? {};
    const commission = commissionRows[0] ?? {};

    // Get premium status & next billing date
    const stallRows = await query<any[]>(
      `SELECT is_premium FROM stalls WHERE vendor_id = ? LIMIT 1`,
      [vendorId]
    );
    const subRows = await query<any[]>(
      `SELECT next_billing_date, status FROM vendor_subscriptions WHERE vendor_id = ? ORDER BY id DESC LIMIT 1`,
      [vendorId]
    );
    const isPremiumStall = stallRows.length > 0 ? Boolean(stallRows[0].is_premium) : false;
    const nextBillingDate = subRows.length > 0 ? subRows[0].next_billing_date : null;
    const subscriptionStatus = subRows.length > 0 ? subRows[0].status : null;
    const premiumPlanRows = await query<any[]>(
      `SELECT price FROM subscription_plans WHERE code = 'PREMIUM_MONTHLY' AND is_active = 1 LIMIT 1`
    );

    res.json(
      ok({
        summary: {
          balance: wallet.balance ?? '0.00',
          totalTopUp: wallet.total_top_up ?? '0.00',
          totalSpent: wallet.total_spent ?? '0.00',
          totalCommission: wallet.total_commission ?? '0.00',
          pendingCommission: commission.pending_commission ?? '0.00',
          approvedCommission: commission.approved_commission ?? '0.00',
          isPremium: isPremiumStall,
          premiumPrice: premiumPlanRows[0]?.price ?? null,
          nextBillingDate,
          subscriptionStatus
        },
        timeline: timelineRows.map((row) => ({
          date: row.date,
          revenue: row.revenue ?? '0.00',
          audioPlays: Number(row.audio_plays ?? 0),
          visits: Number(row.visits ?? 0)
        })),
        transactions: transactionRows.map((row) => ({
          id: String(row.id),
          type: row.transaction_type,
          category: row.transaction_category,
          direction: row.direction,
          amount: row.amount,
          balanceBefore: row.balance_before,
          balanceAfter: row.balance_after,
          description: row.description,
          createdAt: row.created_at
        })),
        topUps: topUpRows.map((row) => ({
          id: String(row.id),
          amount: row.amount,
          provider: row.provider,
          status: row.status,
          note: row.note,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })),
        commissions: payoutRows.map((row) => ({
          id: String(row.id),
          ratePercent: row.rate_percent,
          grossAmount: row.gross_amount,
          commissionAmount: row.commission_amount,
          status: row.status,
          earnedAt: row.earned_at,
          paidAt: row.paid_at
        }))
      })
    );
  })
);

// ──────────────────────────────────────────────
// GET /stall/qr — Return vendor's stall zone_code
// ──────────────────────────────────────────────
router.get(
  '/stall/qr',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const rows = await query<any[]>(
      `SELECT zone_code FROM stalls WHERE vendor_id = ? ORDER BY id ASC LIMIT 1`,
      [vendorId]
    );
    const stall = rows[0];
    res.json(ok({ zoneCode: stall ? stall.zone_code : null }));
  })
);

// ──────────────────────────────────────────────
// GET /stall — Return vendor's stall info
// ──────────────────────────────────────────────
router.get(
  '/stall',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const rows = await query<any[]>(
      `SELECT
         s.id,
         s.name,
         s.slug,
         s.description,
         s.latitude,
         s.longitude,
         s.activation_radius,
         s.status,
         s.is_featured,
         s.is_premium,
         s.priority_score,
         s.opening_hours,
         s.zone_code,
         s.pending_name,
         s.pending_description,
         s.pending_latitude,
         s.pending_longitude,
         s.pending_cover_image_url,
         s.approval_status,
         (SELECT mf.public_url
          FROM media_files mf
          WHERE mf.stall_id = s.id AND mf.file_type = 'IMAGE' AND mf.moderation_status = 'APPROVED'
          ORDER BY mf.id DESC LIMIT 1) AS image_url
       FROM stalls s
       WHERE s.vendor_id = ?
       ORDER BY s.id ASC
       LIMIT 1`,
      [vendorId]
    );

    const stall = rows[0];
    if (!stall) {
      return res.json(ok({ stall: null }));
    }

    let assignedZoneName = null;
    if (stall.zone_code) {
      const zoneRows = await query<any[]>(
        `SELECT name FROM tours WHERE slug = ? OR id = ? LIMIT 1`,
        [stall.zone_code, stall.zone_code]
      );
      assignedZoneName = zoneRows[0]?.name || stall.zone_code;
    }

    res.json(
      ok({
        stall: {
          id: String(stall.id),
          name: stall.name,
          slug: stall.slug,
          description: stall.description,
          latitude: Number(stall.latitude),
          longitude: Number(stall.longitude),
          activationRadius: Number(stall.activation_radius),
          status: stall.status,
          isFeatured: Boolean(stall.is_featured),
          isPremium: Boolean(stall.is_premium),
          priorityScore: Number(stall.priority_score),
          openingHours: stall.opening_hours,
          zoneCode: stall.zone_code,
          assignedZoneName,
          imageUrl: stall.image_url,
          pendingName: stall.pending_name,
          pendingDescription: stall.pending_description,
          pendingLatitude: stall.pending_latitude == null ? null : Number(stall.pending_latitude),
          pendingLongitude: stall.pending_longitude == null ? null : Number(stall.pending_longitude),
          pendingCoverImageUrl: stall.pending_cover_image_url,
          approvalStatus: stall.approval_status
        }
      })
    );
  })
);

// ──────────────────────────────────────────────
// PUT /location — Update stall lat/lng
// ──────────────────────────────────────────────
router.put(
  '/stall',
  imageUpload.single('image'),
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    const uploadedFile = req.file;

    try {
      if (!name) return res.status(400).json({ error: 'Tên sạp là bắt buộc.' });
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
          !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Tọa độ không hợp lệ.' });
      }
      if (uploadedFile && !(await isValidImageFile(uploadedFile.path, uploadedFile.mimetype))) {
        await removeUploadedFile(uploadedFile);
        return res.status(400).json({ error: 'Nội dung file không phải ảnh hợp lệ.' });
      }

      const stallRows = await query<any[]>(
        `SELECT s.id, s.pending_cover_image_url,
                t.latitude AS tour_latitude, t.longitude AS tour_longitude
         FROM stalls s
         JOIN vendors v ON v.id = s.vendor_id
         LEFT JOIN tours t ON t.id = v.assigned_tour_id
         WHERE s.vendor_id = ?
         ORDER BY s.id ASC LIMIT 1`,
        [vendorId]
      );
      const stall = stallRows[0];
      if (!stall) {
        await removeUploadedFile(uploadedFile);
        return res.status(404).json({ error: 'Không tìm thấy sạp của Vendor.' });
      }

      if (stall.tour_latitude != null && stall.tour_longitude != null) {
        const distanceRows = await query<any[]>(
          'SELECT ST_Distance_Sphere(POINT(?, ?), POINT(?, ?)) AS distance_meters',
          [longitude, latitude, Number(stall.tour_longitude), Number(stall.tour_latitude)]
        );
        const maxDistance = Number(process.env.VENDOR_LOCATION_MAX_DISTANCE_METERS ?? 2000);
        if (Number(distanceRows[0]?.distance_meters) > maxDistance) {
          await removeUploadedFile(uploadedFile);
          return res.status(400).json({
            error: `Vị trí nằm ngoài phạm vi hợp lý của khu vực được giao (${maxDistance}m).`,
            code: 'LOCATION_OUTSIDE_ASSIGNED_AREA'
          });
        }
      }

      const publicUrl = uploadedFile ? `/uploads/vendor/${uploadedFile.filename}` : stall.pending_cover_image_url;
      await query(
        `UPDATE stalls
         SET pending_name = ?, pending_description = ?, pending_latitude = ?, pending_longitude = ?,
             pending_cover_image_url = ?, approval_status = 'PENDING', updated_at = NOW()
         WHERE id = ?`,
        [name, description || null, latitude, longitude, publicUrl || null, stall.id]
      );

      const zoneRows = await query<any[]>('SELECT id FROM zones WHERE stall_id = ? ORDER BY id ASC LIMIT 1', [stall.id]);
      const poiId = zoneRows[0]?.id;

      if (uploadedFile) {
        await query(
          `INSERT INTO media_files
            (vendor_id, stall_id, poi_id, file_type, storage_provider, file_name, file_path,
             public_url, mime_type, file_size, moderation_status)
           VALUES (?, ?, ?, 'IMAGE', 'LOCAL', ?, ?, ?, ?, ?, 'PENDING')`,
          [vendorId, stall.id, poiId ?? null, uploadedFile.filename, `vendor/${uploadedFile.filename}`,
            publicUrl, uploadedFile.mimetype, uploadedFile.size]
        );
      }

      res.json(ok({
        submitted: true,
        approvalStatus: 'PENDING',
        pendingImageUrl: publicUrl || null,
        message: 'Thay đổi vị trí, thông tin và ảnh đã được gửi tới hàng chờ duyệt.'
      }));
    } catch (error) {
      await removeUploadedFile(uploadedFile);
      throw error;
    }
  })
);

router.put(
  '/location',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'latitude and longitude must be numbers' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    await query<any>(
      `UPDATE stalls
       SET pending_latitude = ?, pending_longitude = ?, approval_status = 'PENDING', updated_at = NOW()
       WHERE vendor_id = ?
       ORDER BY id ASC
       LIMIT 1`,
      [latitude, longitude, vendorId]
    );

    res.json(ok({ submitted: true, approvalStatus: 'PENDING' }));
  })
);

// ──────────────────────────────────────────────
// GET /content — Return POI contents with approval_status
// ──────────────────────────────────────────────
router.get(
  '/content',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const rows = await query<any[]>(
      `SELECT
         pc.id,
         pc.poi_id,
         pc.lang,
         pc.title,
         pc.short_text,
         pc.tts_script,
         pc.audio_url,
         pc.voice_profile,
         pc.approval_status,
         pc.created_at,
         pc.updated_at,
         p.name AS poi_name
       FROM poi_contents pc
       JOIN pois p ON p.id = pc.poi_id
       JOIN stalls s ON s.id = p.stall_id
       WHERE s.vendor_id = ?
       ORDER BY pc.updated_at DESC`,
      [vendorId]
    );

    res.json(
      ok({
        contents: rows.map((row) => ({
          id: String(row.id),
          poiId: String(row.poi_id),
          poiName: row.poi_name,
          language: row.lang,
          title: row.title,
          shortText: row.short_text,
          ttsScript: row.tts_script,
          audioUrl: row.audio_url,
          voiceProfile: row.voice_profile,
          approvalStatus: row.approval_status,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }))
      })
    );
  })
);

// ──────────────────────────────────────────────
// POST /content — Submit TTS text for approval
// ──────────────────────────────────────────────
router.post(
  '/content',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const { ttsScript, language = 'vi' } = req.body;

    if (!ttsScript || typeof ttsScript !== 'string') {
      return res.status(400).json({ error: 'ttsScript is required' });
    }

    if (ttsScript.trim().length < 50) {
      return res.status(400).json({ error: 'Nội dung TTS phải có ít nhất 50 ký tự' });
    }

    // Find the vendor's first POI
    const poiRows = await query<any[]>(
      `SELECT p.id
       FROM zones p
       JOIN stalls s ON s.id = p.stall_id
       WHERE s.vendor_id = ?
       ORDER BY p.id ASC
       LIMIT 1`,
      [vendorId]
    );

    if (poiRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy POI nào thuộc vendor này' });
    }

    const poiId = poiRows[0].id;

    // Upsert content with pending status
    await query<any>(
      `INSERT INTO poi_contents (poi_id, lang, title, tts_script, approval_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         tts_script = VALUES(tts_script),
         approval_status = 'pending',
         updated_at = NOW()`,
      [poiId, language, `TTS Content - ${language}`, ttsScript.trim()]
    );

    res.json(ok({ submitted: true, approvalStatus: 'pending' }));
  })
);

// ──────────────────────────────────────────────
// POST /pay-subscription — Mock payment endpoint
// ──────────────────────────────────────────────
router.post(
  '/pay-subscription',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    try {
      res.json(ok(await chargeMonthlyRent(vendorId)));
    } catch (error: any) {
      res.status(error.statusCode ?? 500).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  })
);

router.post(
  '/legacy-pay-subscription',
  asyncHandler(async (req, res) => {
    if (req.path) return res.status(410).json({ error: 'Legacy payment flow is disabled.' });
    const vendorId = getVendorId(req.user?.vendorId);

    // Fetch subscription details
    const subRows = await query<any[]>(
      `SELECT vs.id, vs.price_snapshot, vs.next_billing_date, vs.status, vs.plan_id
       FROM vendor_subscriptions vs
       WHERE vs.vendor_id = ?
       ORDER BY vs.id DESC
       LIMIT 1`,
      [vendorId]
    );
    if (subRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy gói đăng ký nào của bạn' });
    }
    const sub = subRows[0];
    const fee = Number(sub.price_snapshot);

    // Retrieve vendor wallet
    const walletRows = await query<any[]>(
      `SELECT id, balance, total_spent FROM vendor_wallets WHERE vendor_id = ? LIMIT 1`,
      [vendorId]
    );
    if (walletRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ví của vendor này' });
    }
    const wallet = walletRows[0];
    const balance = Number(wallet.balance);

    if (balance < fee) {
      // Suspend vendor and stall
      await query(
        `UPDATE stalls SET status = 'SUSPENDED', updated_at = NOW() WHERE vendor_id = ?`,
        [vendorId]
      );
      await query(
        `UPDATE vendors SET status = 'SUSPENDED', updated_at = NOW() WHERE id = ?`,
        [vendorId]
      );
      await query(
        `UPDATE vendor_subscriptions SET status = 'SUSPENDED', updated_at = NOW() WHERE id = ?`,
        [sub.id]
      );
      return res.status(400).json({
        error: 'Số dư ví không đủ. Vui lòng nạp thêm tiền để kích hoạt lại sạp hàng.',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    // Deduct fee from wallet
    const balanceBefore = balance;
    const balanceAfter = balance - fee;
    await query(
      `UPDATE vendor_wallets
       SET balance = ?, total_spent = total_spent + ?, updated_at = NOW()
       WHERE id = ?`,
      [balanceAfter, fee, wallet.id]
    );

    // Record wallet transaction
    await query(
      `INSERT INTO wallet_transactions (wallet_id, vendor_id, transaction_type, direction, amount, balance_before, balance_after, description, created_at, updated_at)
       VALUES (?, ?, 'FEE', 'DEBIT', ?, ?, ?, ?, NOW(), NOW())`,
      [wallet.id, vendorId, fee, balanceBefore, balanceAfter, 'Gia hạn phí thuê WebApp hàng tháng']
    );

    // Extend billing end date by exactly 1 month
    await query(
      `UPDATE vendor_subscriptions
       SET status = 'ACTIVE',
           payment_status = 'paid',
           period_start = COALESCE(next_billing_date, CURDATE()),
           period_end = DATE_ADD(COALESCE(next_billing_date, CURDATE()), INTERVAL 1 MONTH),
           next_billing_date = DATE_ADD(COALESCE(next_billing_date, CURDATE()), INTERVAL 1 MONTH),
           updated_at = NOW()
       WHERE id = ?`,
      [sub.id]
    );

    // Set stall and vendor to APPROVED/ACTIVE on successful pay
    await query(
      `UPDATE stalls SET status = 'APPROVED', updated_at = NOW() WHERE vendor_id = ? AND status = 'SUSPENDED'`,
      [vendorId]
    );
    await query(
      `UPDATE vendors SET status = 'APPROVED', updated_at = NOW() WHERE id = ? AND status = 'SUSPENDED'`,
      [vendorId]
    );

    res.json(ok({ paid: true, message: 'Thanh toán phí thuê WebApp thành công. Đã gia hạn thêm 1 tháng.' }));
  })
);

// ──────────────────────────────────────────────
// PUT /pois/:id — Vendor submits updates for approval
// ──────────────────────────────────────────────
router.put(
  '/pois/:id',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const poiId = req.params.id;
    const { name, description, imageUrl } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên POI là bắt buộc' });
    }

    // Verify POI belongs to vendor
    const check = await query<any[]>(
      `SELECT p.id FROM zones p JOIN stalls s ON s.id = p.stall_id WHERE p.id = ? AND s.vendor_id = ?`,
      [poiId, vendorId]
    );
    if (check.length === 0) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa POI này' });
    }

    // Update pending_* columns and set approval_status to 'PENDING'
    await query(
      `UPDATE pois SET pending_name = ?, pending_description = ?, pending_cover_image_url = ?, approval_status = 'PENDING', updated_at = NOW() WHERE id = ?`,
      [name.trim(), description ? description.trim() : null, imageUrl ? imageUrl.trim() : null, poiId]
    );
    await query(
      `UPDATE zones SET pending_name = ?, pending_description = ?, pending_cover_image_url = ?, approval_status = 'PENDING', updated_at = NOW() WHERE id = ?`,
      [name.trim(), description ? description.trim() : null, imageUrl ? imageUrl.trim() : null, poiId]
    );

    res.json(ok({ success: true, message: 'Gửi yêu cầu chỉnh sửa POI thành công. Vui lòng chờ admin duyệt.' }));
  })
);

// ──────────────────────────────────────────────
// POST /premium/request — Vendor upgrades to Premium via wallet deduction
// ──────────────────────────────────────────────
router.post(
  '/premium/request',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    try {
      res.json(ok(await upgradeVendorToPremium(vendorId)));
    } catch (error: any) {
      res.status(error.statusCode ?? 500).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  })
);

router.post(
  '/legacy-premium/request',
  asyncHandler(async (req, res) => {
    if (req.path) return res.status(410).json({ error: 'Legacy premium flow is disabled.' });
    const vendorId = getVendorId(req.user?.vendorId);

    // Premium Monthly plan price
    const premiumPlanRows = await query<any[]>(
      `SELECT id, price FROM subscription_plans WHERE code = 'PREMIUM_MONTHLY' LIMIT 1`
    );
    const premiumFee = premiumPlanRows.length > 0 ? Number(premiumPlanRows[0].price) : 599000;
    const premiumPlanId = premiumPlanRows.length > 0 ? premiumPlanRows[0].id : 2;

    // Retrieve vendor wallet
    const walletRows = await query<any[]>(
      `SELECT id, balance, total_spent FROM vendor_wallets WHERE vendor_id = ? LIMIT 1`,
      [vendorId]
    );
    if (walletRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ví của vendor này' });
    }
    const wallet = walletRows[0];
    const balance = Number(wallet.balance);

    if (balance < premiumFee) {
      return res.status(400).json({
        error: 'Số dư ví không đủ để nâng cấp lên Premium. Vui lòng nạp thêm tiền.',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    // Deduct fee from wallet
    const balanceBefore = balance;
    const balanceAfter = balance - premiumFee;
    await query(
      `UPDATE vendor_wallets
       SET balance = ?, total_spent = total_spent + ?, updated_at = NOW()
       WHERE id = ?`,
      [balanceAfter, premiumFee, wallet.id]
    );

    // Record wallet transaction
    await query(
      `INSERT INTO wallet_transactions (wallet_id, vendor_id, transaction_type, direction, amount, balance_before, balance_after, description, created_at, updated_at)
       VALUES (?, ?, 'FEE', 'DEBIT', ?, ?, ?, ?, NOW(), NOW())`,
      [wallet.id, vendorId, premiumFee, balanceBefore, balanceAfter, 'Nâng cấp lên gói Premium']
    );

    // Upgrade subscription to Premium Monthly
    const subRows = await query<any[]>(
      `SELECT id FROM vendor_subscriptions WHERE vendor_id = ? ORDER BY id DESC LIMIT 1`,
      [vendorId]
    );
    if (subRows.length > 0) {
      await query(
        `UPDATE vendor_subscriptions
         SET plan_id = ?,
             status = 'ACTIVE',
             payment_status = 'paid',
             price_snapshot = ?,
             period_start = CURDATE(),
             period_end = DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
             next_billing_date = DATE_ADD(CURDATE(), INTERVAL 1 MONTH),
             updated_at = NOW()
         WHERE id = ?`,
        [premiumPlanId, premiumFee, subRows[0].id]
      );
    } else {
      await query(
        `INSERT INTO vendor_subscriptions (vendor_id, plan_id, status, period_start, period_end, next_billing_date, payment_status, price_snapshot, created_at, updated_at)
         VALUES (?, ?, 'ACTIVE', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'paid', ?, NOW(), NOW())`,
        [vendorId, premiumPlanId, premiumFee]
      );
    }

    // Upgrade stall to premium
    await query(
      `UPDATE stalls
       SET is_premium = 1, activation_radius = 10, priority_score = 100, updated_at = NOW()
       WHERE vendor_id = ?`,
      [vendorId]
    );

    res.json(ok({ success: true, message: 'Nâng cấp lên Premium thành công!' }));
  })
);

// ──────────────────────────────────────────────
// POST /poi/request-update — Vendor submits POI updates for approval without routing parameter
// ──────────────────────────────────────────────
router.post(
  '/poi/request-update',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const { name, description, imageUrl } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên POI là bắt buộc' });
    }

    const poiRows = await query<any[]>(
      `SELECT p.id
       FROM zones p
       JOIN stalls s ON s.id = p.stall_id
       WHERE s.vendor_id = ?
       ORDER BY p.id ASC
       LIMIT 1`,
      [vendorId]
    );

    if (poiRows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy POI nào thuộc vendor này' });
    }

    const poiId = poiRows[0].id;

    await query(
      `UPDATE pois SET pending_name = ?, pending_description = ?, pending_cover_image_url = ?, approval_status = 'PENDING', updated_at = NOW() WHERE id = ?`,
      [name.trim(), description ? description.trim() : null, imageUrl ? imageUrl.trim() : null, poiId]
    );
    await query(
      `UPDATE zones SET pending_name = ?, pending_description = ?, pending_cover_image_url = ?, approval_status = 'PENDING', updated_at = NOW() WHERE id = ?`,
      [name.trim(), description ? description.trim() : null, imageUrl ? imageUrl.trim() : null, poiId]
    );

    res.json(ok({ success: true, message: 'Gửi yêu cầu chỉnh sửa POI thành công. Vui lòng chờ admin duyệt.' }));
  })
);

// ──────────────────────────────────────────────
// GET /pois/:poiId/products — Get POI products
// ──────────────────────────────────────────────
router.post(
  '/topups',
  imageUpload.single('proof'),
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const amount = Number(req.body.amount);
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
    const proof = req.file;

    try {
      if (!Number.isFinite(amount) || amount <= 0) {
        await removeUploadedFile(proof);
        return res.status(400).json({ error: 'Số tiền nạp phải lớn hơn 0.' });
      }
      if (!proof) return res.status(400).json({ error: 'Ảnh xác nhận chuyển khoản là bắt buộc.' });
      if (!(await isValidImageFile(proof.path, proof.mimetype))) {
        await removeUploadedFile(proof);
        return res.status(400).json({ error: 'Nội dung file xác nhận không phải ảnh hợp lệ.' });
      }
      const walletRows = await query<any[]>('SELECT id FROM vendor_wallets WHERE vendor_id = ? LIMIT 1', [vendorId]);
      if (!walletRows[0]) {
        await removeUploadedFile(proof);
        return res.status(404).json({ error: 'Không tìm thấy ví của Vendor.' });
      }
      const proofUrl = `/uploads/vendor/${proof.filename}`;
      const result = await query<any>(
        `INSERT INTO top_up_requests
          (vendor_id, wallet_id, provider, status, amount, proof_url, note)
         VALUES (?, ?, 'BANK_QR', 'PENDING', ?, ?, ?)`,
        [vendorId, walletRows[0].id, amount, proofUrl, note || null]
      );
      await query(
        `INSERT INTO admin_notifications
          (vendor_id, notification_type, title, message, metadata)
         VALUES (?, 'WALLET_TOP_UP_REQUEST', 'Yêu cầu nạp tiền mới', ?, ?)`,
        [vendorId, `Vendor đã gửi yêu cầu nạp ${amount.toLocaleString('vi-VN')} VND.`,
          JSON.stringify({ topUpRequestId: String(result.insertId), amount })]
      );
      res.status(201).json(ok({ id: String(result.insertId), amount, status: 'PENDING', proofUrl }));
    } catch (error) {
      await removeUploadedFile(proof);
      throw error;
    }
  })
);

router.get(
  '/pois/:poiId/products',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const { poiId } = req.params;

    const check = await query<any[]>(
      `SELECT p.id FROM zones p JOIN stalls s ON s.id = p.stall_id WHERE p.id = ? AND s.vendor_id = ?`,
      [poiId, vendorId]
    );
    if (check.length === 0) {
      return res.status(403).json({ error: 'Không có quyền truy cập POI này' });
    }

    const rows = await query<any[]>(
      `SELECT id, name, price FROM poi_products WHERE poi_id = ? ORDER BY id ASC`,
      [poiId]
    );

    res.json(ok({ products: rows.map(r => ({ id: String(r.id), name: r.name, price: Number(r.price) })) }));
  })
);

// ──────────────────────────────────────────────
// POST /pois/:poiId/products — Create POI product
// ──────────────────────────────────────────────
router.post(
  '/pois/:poiId/products',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const { poiId } = req.params;
    const { name, price } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên sản phẩm là bắt buộc' });
    }
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Giá tiền phải là số và lớn hơn hoặc bằng 0' });
    }

    const check = await query<any[]>(
      `SELECT p.id FROM zones p JOIN stalls s ON s.id = p.stall_id WHERE p.id = ? AND s.vendor_id = ?`,
      [poiId, vendorId]
    );
    if (check.length === 0) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa POI này' });
    }

    const result = await query<any>(
      `INSERT INTO poi_products (poi_id, name, price) VALUES (?, ?, ?)`,
      [poiId, name.trim(), price]
    );

    res.json(ok({ id: String(result.insertId), name: name.trim(), price }));
  })
);

// ──────────────────────────────────────────────
// PUT /pois/:poiId/products/:id — Update POI product
// ──────────────────────────────────────────────
router.put(
  '/pois/:poiId/products/:id',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const { poiId, id } = req.params;
    const { name, price } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên sản phẩm là bắt buộc' });
    }
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Giá tiền phải là số và lớn hơn hoặc bằng 0' });
    }

    const check = await query<any[]>(
      `SELECT p.id FROM zones p JOIN stalls s ON s.id = p.stall_id WHERE p.id = ? AND s.vendor_id = ?`,
      [poiId, vendorId]
    );
    if (check.length === 0) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa POI này' });
    }

    await query(
      `UPDATE poi_products SET name = ?, price = ?, updated_at = NOW() WHERE id = ? AND poi_id = ?`,
      [name.trim(), price, id, poiId]
    );

    res.json(ok({ id, name: name.trim(), price }));
  })
);

// ──────────────────────────────────────────────
// DELETE /pois/:poiId/products/:id — Delete POI product
// ──────────────────────────────────────────────
router.delete(
  '/pois/:poiId/products/:id',
  asyncHandler(async (req, res) => {
    const vendorId = getVendorId(req.user?.vendorId);
    const { poiId, id } = req.params;

    const check = await query<any[]>(
      `SELECT p.id FROM zones p JOIN stalls s ON s.id = p.stall_id WHERE p.id = ? AND s.vendor_id = ?`,
      [poiId, vendorId]
    );
    if (check.length === 0) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa POI này' });
    }

    await query(
      `DELETE FROM poi_products WHERE id = ? AND poi_id = ?`,
      [id, poiId]
    );

    res.json(ok({ success: true }));
  })
);

export default router;
