import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR, UserRole.FINANCE));

// ──────────────────────────────────────────────
// GET /hourly-active-users — Real-time traffic chart
// ──────────────────────────────────────────────
router.get(
  '/hourly-active-users',
  asyncHandler(async (req, res) => {
    const rows = await query<any[]>(
      `SELECT
         DATE_FORMAT(hours.hour_start, '%H:00') AS hour,
         COALESCE(COUNT(DISTINCT ve.visitor_session_id), 0) AS active_users
       FROM (
         SELECT TIMESTAMP(CURDATE(), MAKETIME(0, 0, 0)) AS hour_start UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(1, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(2, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(3, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(4, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(5, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(6, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(7, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(8, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(9, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(10, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(11, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(12, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(13, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(14, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(15, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(16, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(17, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(18, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(19, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(20, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(21, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(22, 0, 0)) UNION ALL
         SELECT TIMESTAMP(CURDATE(), MAKETIME(23, 0, 0))
       ) hours
       LEFT JOIN visit_events ve
         ON ve.visited_at >= hours.hour_start
        AND ve.visited_at < hours.hour_start + INTERVAL 1 HOUR
       WHERE hours.hour_start <= NOW()
       GROUP BY hours.hour_start
       ORDER BY hours.hour_start ASC`
    );

    const currentHour = new Date().getHours().toString().padStart(2, '0') + ':00';
    const currentRow = rows.find((row) => row.hour === currentHour);

    res.json(
      ok({
        points: rows.map((row) => ({
          hour: row.hour,
          activeUsers: Number(row.active_users ?? 0)
        })),
        activeUsersNow: Number(currentRow?.active_users ?? 0),
        updatedAt: new Date().toISOString()
      })
    );
  })
);

// ──────────────────────────────────────────────
// GET /dashboard — Full dashboard stats from real database
// Returns KPIs, Tour scan stats, and POI play/visit stats
// ──────────────────────────────────────────────
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    // KPIs
    const [vendorStats] = await query<any[]>(
      `SELECT
         COUNT(*) AS total_vendors,
         SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS active_vendors,
         SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_vendors
       FROM vendors`
    );

    const [poiStats] = await query<any[]>(
      `SELECT COUNT(*) AS active_pois FROM zones WHERE status = 'ACTIVE'`
    );

    const [revenueStats] = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments WHERE status = 'PAID'`
    );

    const [scanStats] = await query<any[]>(
      `SELECT COUNT(*) AS total_scans FROM qr_scan_events`
    );

    // Tour-level stats: scan count per tour
    const tourStats = await query<any[]>(
      `SELECT
         t.id AS tour_id,
         t.name AS tour_name,
         t.slug AS tour_slug,
         t.status AS tour_status,
         COUNT(DISTINCT qse.id) AS scan_count,
         (SELECT COUNT(*) FROM zones z WHERE z.tour_id = t.id AND z.status = 'ACTIVE') AS poi_count
       FROM tours t
       LEFT JOIN qr_scan_events qse ON qse.tour_id = t.id
       WHERE t.status != 'ARCHIVED'
       GROUP BY t.id, t.name, t.slug, t.status
       ORDER BY scan_count DESC, t.name ASC`
    );

    // POI-level stats: play count + visit count per zone
    const poiDetailStats = await query<any[]>(
      `SELECT
         z.id AS poi_id,
         z.name AS poi_name,
         z.slug AS poi_slug,
         z.status AS poi_status,
         t.name AS tour_name,
         t.slug AS tour_slug,
         s.name AS stall_name,
         COUNT(DISTINCT ph.id) AS play_count,
         COUNT(DISTINCT ve.id) AS visit_count
       FROM zones z
       LEFT JOIN tours t ON t.id = z.tour_id
       LEFT JOIN stalls s ON s.id = z.stall_id
       LEFT JOIN play_history ph ON ph.poi_id = z.id
       LEFT JOIN visit_events ve ON ve.poi_id = z.id
       WHERE z.status != 'HIDDEN'
       GROUP BY z.id, z.name, z.slug, z.status, t.name, t.slug, s.name
       ORDER BY play_count DESC, visit_count DESC, z.name ASC`
    );

    res.json(
      ok({
        kpis: {
          totalVendors: Number(vendorStats?.total_vendors ?? 0),
          activeVendors: Number(vendorStats?.active_vendors ?? 0),
          pendingVendors: Number(vendorStats?.pending_vendors ?? 0),
          activePois: Number(poiStats?.active_pois ?? 0),
          totalRevenue: Number(revenueStats?.total_revenue ?? 0),
          totalScans: Number(scanStats?.total_scans ?? 0),
        },
        tourStats: tourStats.map((row) => ({
          tourId: String(row.tour_id),
          tourName: row.tour_name,
          tourSlug: row.tour_slug,
          tourStatus: row.tour_status,
          scanCount: Number(row.scan_count),
          poiCount: Number(row.poi_count),
        })),
        poiStats: poiDetailStats.map((row) => ({
          poiId: String(row.poi_id),
          poiName: row.poi_name,
          poiSlug: row.poi_slug,
          poiStatus: row.poi_status,
          tourName: row.tour_name,
          tourSlug: row.tour_slug,
          stallName: row.stall_name,
          playCount: Number(row.play_count),
          visitCount: Number(row.visit_count),
        })),
      })
    );
  })
);

// ──────────────────────────────────────────────
// GET /realtime-traffic — Real-time live analytics per tour zone
// ──────────────────────────────────────────────
router.get(
  '/realtime-traffic',
  asyncHandler(async (_req, res) => {
    const activeVisitors = await query<any[]>(
      `SELECT 
         t.id AS tour_id,
         t.name AS tour_name,
         COALESCE(active_sessions.count, 0) AS active_visitors
       FROM tours t
       LEFT JOIN (
         SELECT latest_tour.tour_id, COUNT(DISTINCT latest_tour.visitor_session_id) AS count
         FROM (
           SELECT 
             vs.id AS visitor_session_id,
             (
               SELECT COALESCE(
                 (SELECT z.tour_id 
                  FROM visit_events ve 
                  JOIN zones z ON z.id = ve.poi_id 
                  WHERE ve.visitor_session_id = vs.id 
                  ORDER BY ve.visited_at DESC LIMIT 1),
                 (SELECT qse.tour_id 
                  FROM qr_scan_events qse 
                  WHERE qse.visitor_session_id = vs.id 
                  ORDER BY qse.scanned_at DESC LIMIT 1),
                 NULL
               )
             ) AS tour_id
           FROM visitor_sessions vs
           WHERE vs.last_seen_at >= NOW() - INTERVAL 5 MINUTE
         ) latest_tour
         WHERE latest_tour.tour_id IS NOT NULL
         GROUP BY latest_tour.tour_id
       ) active_sessions ON active_sessions.tour_id = t.id
       WHERE t.status != 'ARCHIVED'
       ORDER BY active_visitors DESC, t.name ASC`
    );

    const qrScans = await query<any[]>(
      `SELECT 
         t.id AS tour_id,
         COUNT(qse.id) AS total_qr_scans
       FROM tours t
       LEFT JOIN qr_scan_events qse ON qse.tour_id = t.id
       WHERE t.status != 'ARCHIVED'
       GROUP BY t.id`
    );

    const results = activeVisitors.map((row) => {
      const scanRow = qrScans.find((s) => String(s.tour_id) === String(row.tour_id));
      return {
        tourId: String(row.tour_id),
        tourName: row.tour_name,
        activeVisitors: Number(row.active_visitors),
        totalQrScans: Number(scanRow?.total_qr_scans ?? 0)
      };
    });

    res.json(ok(results));
  })
);

export default router;
