import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ok } from '../types/api.types';
import { query } from '../lib/db';
import { asyncHandler } from '../utils/asyncHandler';
import { toBigIntId } from '../utils/serialization';
import { buildPoiZoneScope, buildStallZoneScope } from '../utils/zoneScope';

export const router = Router();

const poiManagers = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate, authorize(...poiManagers));

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

async function getPoiRow(id: bigint, req?: Parameters<typeof buildPoiZoneScope>[0]) {
  const zoneScope = req ? buildPoiZoneScope(req) : { clause: '', params: [] };
  const rows = await query<any[]>(
    `SELECT p.*, s.name AS stall_name
     FROM pois p
     LEFT JOIN stalls s ON s.id = p.stall_id
     WHERE p.id = ?
     ${zoneScope.clause}
     LIMIT 1`,
    [id.toString(), ...zoneScope.params]
  );
  return rows[0];
}

async function isStallAllowed(req: Parameters<typeof buildStallZoneScope>[0], stallId: string) {
  const zoneScope = buildStallZoneScope(req);
  const rows = await query<any[]>(
    `SELECT s.id FROM stalls s WHERE s.id = ? ${zoneScope.clause} LIMIT 1`,
    [stallId, ...zoneScope.params]
  );

  return rows.length > 0;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const zoneScope = buildPoiZoneScope(req);
    const rows = await query<any[]>(
      `SELECT p.*, s.name AS stall_name,
              (SELECT COUNT(*) FROM poi_contents pc WHERE pc.poi_id = p.id) AS contents_count,
              (SELECT COUNT(*) FROM media_files mf WHERE mf.poi_id = p.id) AS media_count
       FROM pois p
       LEFT JOIN stalls s ON s.id = p.stall_id
       WHERE p.status != 'HIDDEN'
       ${zoneScope.clause}
       ORDER BY p.id DESC`,
      zoneScope.params
    );

    res.json(
      ok(
        rows.map((row) => ({
          id: String(row.id),
          stallId: String(row.stall_id),
          stallName: row.stall_name || 'N/A',
          name: row.name,
          slug: row.slug,
          description: row.description,
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          activationRadius: Number(row.activation_radius),
          isPremiumContent: Boolean(row.is_premium_content),
          status: row.status,
          sortOrder: Number(row.sort_order),
          contents: Number(row.contents_count),
          mediaFiles: Number(row.media_count),
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }))
      )
    );
  })
);

router.get(
  '/stalls',
  asyncHandler(async (req, res) => {
    const zoneScope = buildStallZoneScope(req);
    const rows = await query<any[]>(
      `SELECT id, name FROM stalls s WHERE 1 = 1 ${zoneScope.clause} ORDER BY name ASC`,
      zoneScope.params
    );
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

router.get(
  '/zones',
  asyncHandler(async (_req, res) => {
    const rows = await query<any[]>(
      `SELECT id, zone_code, name
       FROM zones
       WHERE is_active = 1
       ORDER BY name ASC`
    );

    res.json(
      ok(
        rows.map((row) => ({
          id: String(row.id),
          code: row.zone_code,
          name: row.name
        }))
      )
    );
  })
);

router.get(
  '/distance',
  asyncHandler(async (req, res) => {
    const poi1Id = toBigIntId(String(req.query.poi1_id ?? ''), 'poi1_id');
    const poi2Id = toBigIntId(String(req.query.poi2_id ?? ''), 'poi2_id');
    const zoneScope1 = buildPoiZoneScope(req, 's1');
    const zoneScope2 = buildPoiZoneScope(req, 's2');

    const rows = await query<any[]>(
      `SELECT ST_Distance_Sphere(
          POINT(p1.longitude, p1.latitude),
          POINT(p2.longitude, p2.latitude)
        ) AS distance_meters
       FROM pois p1
       JOIN stalls s1 ON s1.id = p1.stall_id
       JOIN pois p2 ON p2.id = ?
       JOIN stalls s2 ON s2.id = p2.stall_id
       WHERE p1.id = ?
         AND p1.status != 'HIDDEN'
         AND p2.status != 'HIDDEN'
         ${zoneScope1.clause}
         ${zoneScope2.clause}
       LIMIT 1`,
      [poi2Id.toString(), poi1Id.toString(), ...zoneScope1.params, ...zoneScope2.params]
    );

    if (!rows[0] || rows[0].distance_meters == null) {
      res.status(404).json({ success: false, error: 'POIs not found' });
      return;
    }

    res.json(ok({ distanceMeters: Number(rows[0].distance_meters) }));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { stallId, name, description, latitude, longitude, activationRadius, isPremiumContent, status } = req.body;
    const slug = slugify(name);

    if (!(await isStallAllowed(req, String(stallId)))) {
      res.status(403).json({ success: false, error: 'Stall is outside assigned zone' });
      return;
    }

    const result = await query<any>(
      `INSERT INTO pois (stall_id, name, slug, description, latitude, longitude, activation_radius, is_premium_content, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        stallId,
        name,
        slug,
        description || null,
        latitude,
        longitude,
        activationRadius || 25,
        isPremiumContent ? 1 : 0,
        status || 'ACTIVE'
      ]
    );

    const insertId = BigInt(result.insertId);
    const after = await getPoiRow(insertId, req);

    req.auditMeta = {
      action: 'CREATE_POI',
      targetType: 'pois',
      targetId: insertId,
      beforeData: null,
      afterData: after
    };

    res.json(
      ok({
        id: String(after.id),
        stallId: String(after.stall_id),
        stallName: after.stall_name || 'N/A',
        name: after.name,
        slug: after.slug,
        description: after.description,
        latitude: Number(after.latitude),
        longitude: Number(after.longitude),
        activationRadius: Number(after.activation_radius),
        isPremiumContent: Boolean(after.is_premium_content),
        status: after.status,
        sortOrder: Number(after.sort_order),
        contents: 0,
        mediaFiles: 0,
        createdAt: after.created_at,
        updatedAt: after.updated_at
      })
    );
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'poi id');
    const { stallId, name, description, latitude, longitude, activationRadius, isPremiumContent, status } = req.body;
    const slug = slugify(name);

    const before = await getPoiRow(id, req);
    if (!before) {
      res.status(404).json({ success: false, error: 'POI not found' });
      return;
    }

    if (!(await isStallAllowed(req, String(stallId)))) {
      res.status(403).json({ success: false, error: 'Stall is outside assigned zone' });
      return;
    }

    await query(
      `UPDATE pois
       SET stall_id = ?, name = ?, slug = ?, description = ?, latitude = ?, longitude = ?, activation_radius = ?, is_premium_content = ?, status = ?
       WHERE id = ?`,
      [
        stallId,
        name,
        slug,
        description || null,
        latitude,
        longitude,
        activationRadius,
        isPremiumContent ? 1 : 0,
        status,
        id.toString()
      ]
    );

    const after = await getPoiRow(id, req);

    req.auditMeta = {
      action: 'UPDATE_POI',
      targetType: 'pois',
      targetId: id,
      beforeData: before,
      afterData: after
    };

    res.json(
      ok({
        id: String(after.id),
        stallId: String(after.stall_id),
        stallName: after.stall_name || 'N/A',
        name: after.name,
        slug: after.slug,
        description: after.description,
        latitude: Number(after.latitude),
        longitude: Number(after.longitude),
        activationRadius: Number(after.activation_radius),
        isPremiumContent: Boolean(after.is_premium_content),
        status: after.status,
        sortOrder: Number(after.sort_order),
        createdAt: after.created_at,
        updatedAt: after.updated_at
      })
    );
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'poi id');

    const before = await getPoiRow(id, req);
    if (!before) {
      res.status(404).json({ success: false, error: 'POI not found' });
      return;
    }

    await query(`UPDATE pois SET status = 'HIDDEN' WHERE id = ?`, [id.toString()]);

    const after = await getPoiRow(id, req);

    req.auditMeta = {
      action: 'DELETE_POI',
      targetType: 'pois',
      targetId: id,
      beforeData: before,
      afterData: after
    };

    res.json(ok({ success: true }));
  })
);

export default router;
