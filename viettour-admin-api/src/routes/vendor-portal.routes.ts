import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { query } from '../lib/db';
import { UserRole } from '../types/domain';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();

router.use(authenticate, authorize(UserRole.VENDOR));

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
           (SELECT COUNT(*) FROM pois p JOIN stalls s ON s.id = p.stall_id WHERE s.vendor_id = ?) AS total_pois,
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
         FROM pois p
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
              subscriptionPeriodEnd: vendor.period_end
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
         s.name AS stall_name,
         (SELECT COUNT(DISTINCT pc.lang) FROM poi_contents pc WHERE pc.poi_id = p.id) AS language_count,
         (SELECT COUNT(*) FROM play_history ph WHERE ph.poi_id = p.id) AS audio_plays,
         (SELECT mf.public_url FROM media_files mf WHERE mf.poi_id = p.id AND mf.file_type = 'IMAGE' ORDER BY mf.id ASC LIMIT 1) AS image_url
       FROM pois p
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
          imageUrl: row.image_url
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

    res.json(
      ok({
        summary: {
          balance: wallet.balance ?? '0.00',
          totalTopUp: wallet.total_top_up ?? '0.00',
          totalSpent: wallet.total_spent ?? '0.00',
          totalCommission: wallet.total_commission ?? '0.00',
          pendingCommission: commission.pending_commission ?? '0.00',
          approvedCommission: commission.approved_commission ?? '0.00'
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

export default router;