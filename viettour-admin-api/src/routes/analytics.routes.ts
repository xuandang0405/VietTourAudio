import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';
import { buildStallZoneScope } from '../utils/zoneScope';

export const router = Router();

router.use(authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR, UserRole.FINANCE));

router.get(
  '/hourly-active-users',
  asyncHandler(async (req, res) => {
    const assignedZoneId = req.user?.role === UserRole.ADMIN && req.user.assignedZoneId != null ? req.user.assignedZoneId.toString() : null;
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
       LEFT JOIN stalls s ON s.id = ve.stall_id
       LEFT JOIN zones z_scope ON z_scope.zone_code = s.zone_code
       WHERE hours.hour_start <= NOW()
       ${assignedZoneId ? 'AND (ve.id IS NULL OR z_scope.id = ?)' : ''}
       GROUP BY hours.hour_start
       ORDER BY hours.hour_start ASC`,
      assignedZoneId ? [assignedZoneId] : []
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

export default router;
