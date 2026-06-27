import { Router } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { PoiController, TourController } from '../controllers/poi.controller';
import { asyncHandler } from '../utils/asyncHandler';
import { query } from '../lib/db';
import { ok } from '../types/api.types';

export const router = Router();
const controller = new PoiController();
const tourController = new TourController();

const poiManagers = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate, authorize(...poiManagers));

// ── POI (Zone) routes ──
router.get(
  '/',
  asyncHandler(controller.getAllPois)
);

router.get(
  '/stalls',
  asyncHandler(controller.getAllStalls)
);

router.get(
  '/zones',
  asyncHandler(controller.getActiveZones)
);

router.get(
  '/distance',
  asyncHandler(controller.getDistance)
);

router.post(
  '/',
  asyncHandler(controller.createPoi)
);

router.put(
  '/:id',
  asyncHandler(controller.updatePoi)
);

router.delete(
  '/:id',
  asyncHandler(controller.deletePoi)
);

// ── Tour (Khu vực) routes ──
router.get(
  '/tours',
  asyncHandler(tourController.getAllTours)
);

router.get(
  '/tours/:id',
  asyncHandler(tourController.getTour)
);

router.post(
  '/tours',
  asyncHandler(tourController.createTour)
);

router.put(
  '/tours/:id',
  asyncHandler(tourController.updateTour)
);

router.delete(
  '/tours/:id',
  asyncHandler(tourController.deleteTour)
);

router.post(
  '/tours/:id/qr/reset',
  asyncHandler(tourController.resetTourQr)
);

// ── POI Update Approval routes ──
router.get(
  '/approvals',
  asyncHandler(async (req, res) => {
    const [rows, stallRows] = await Promise.all([
      query<any[]>(
      `SELECT p.id, p.name, p.description, p.pending_name, p.pending_description, p.pending_cover_image_url,
              p.pending_latitude, p.pending_longitude, p.latitude, p.longitude, p.approval_status,
              s.name AS stall_name, v.trade_name AS vendor_name,
              (SELECT mf.public_url FROM media_files mf WHERE mf.poi_id = p.id AND mf.file_type = 'IMAGE' ORDER BY mf.id ASC LIMIT 1) AS image_url
       FROM zones p
       JOIN stalls s ON s.id = p.stall_id
       JOIN vendors v ON v.id = s.vendor_id
       WHERE p.approval_status = 'PENDING'
       ORDER BY p.updated_at DESC`
      ),
      query<any[]>(
        `SELECT s.id, s.name, s.description, s.pending_name, s.pending_description, s.pending_cover_image_url,
                s.pending_latitude, s.pending_longitude, s.latitude, s.longitude, s.approval_status,
                s.name AS stall_name, v.trade_name AS vendor_name,
                (SELECT mf.public_url FROM media_files mf
                 WHERE mf.stall_id = s.id AND mf.file_type = 'IMAGE' AND mf.moderation_status = 'APPROVED'
                 ORDER BY mf.id DESC LIMIT 1) AS image_url
         FROM stalls s
         JOIN vendors v ON v.id = s.vendor_id
         WHERE s.approval_status = 'PENDING'
         ORDER BY s.updated_at DESC`
      )
    ]);
    const mapApproval = (row: any, id: string) => ({
      id,
      id: String(row.id),
      name: row.name,
      description: row.description,
      pendingName: row.pending_name,
      pendingDescription: row.pending_description,
      pendingCoverImageUrl: row.pending_cover_image_url,
      pendingLatitude: row.pending_latitude == null ? null : Number(row.pending_latitude),
      pendingLongitude: row.pending_longitude == null ? null : Number(row.pending_longitude),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      approvalStatus: row.approval_status,
      stallName: row.stall_name,
      vendorName: row.vendor_name,
      imageUrl: row.image_url
    });
    res.json(ok([
      ...stallRows.map((row) => ({ ...mapApproval(row, `stall-${row.id}`), id: `stall-${row.id}`, entityType: 'STALL' })),
      ...rows.map((row) => ({ ...mapApproval(row, String(row.id)), entityType: 'POI' }))
    ]));
  })
);

router.post(
  '/:id/approve',
  asyncHandler(async (req, res) => {
    const poiId = req.params.id;
    if (poiId.startsWith('stall-')) {
      const stallId = poiId.slice('stall-'.length);
      const rows = await query<any[]>(
        `SELECT pending_name, pending_description, pending_cover_image_url, pending_latitude, pending_longitude
         FROM stalls WHERE id = ? AND approval_status = 'PENDING' LIMIT 1`,
        [stallId]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Pending stall change not found' });
      const pending = rows[0];
      await query(
        `UPDATE stalls
         SET name = COALESCE(pending_name, name), description = COALESCE(pending_description, description),
             latitude = COALESCE(pending_latitude, latitude), longitude = COALESCE(pending_longitude, longitude),
             pending_name = NULL, pending_description = NULL, pending_cover_image_url = NULL,
             pending_latitude = NULL, pending_longitude = NULL, approval_status = 'APPROVED', updated_at = NOW()
         WHERE id = ?`,
        [stallId]
      );
      if (pending.pending_cover_image_url) {
        await query(
          `UPDATE media_files
           SET moderation_status = 'APPROVED', moderated_at = NOW(), updated_at = NOW()
           WHERE stall_id = ? AND public_url = ? AND moderation_status = 'PENDING'`,
          [stallId, pending.pending_cover_image_url]
        );
      }
      return res.json(ok({ success: true, entityType: 'STALL' }));
    }
    
    // Fetch the pending data
    const rows = await query<any[]>(
      `SELECT pending_name, pending_description, pending_cover_image_url, pending_latitude, pending_longitude, stall_id
       FROM zones WHERE id = ? LIMIT 1`,
      [poiId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'POI not found' });
    }
    const { pending_name, pending_description, pending_cover_image_url, pending_latitude, pending_longitude, stall_id } = rows[0];
    
    if (!pending_name) {
      return res.status(400).json({ error: 'No pending changes to approve' });
    }
    
    // Update main fields with pending fields
    await query(
      `UPDATE pois
       SET name = ?, description = ?, latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude),
           pending_name = NULL, pending_description = NULL, pending_cover_image_url = NULL,
           pending_latitude = NULL, pending_longitude = NULL, approval_status = 'APPROVED', updated_at = NOW()
       WHERE id = ?`,
      [pending_name, pending_description, pending_latitude, pending_longitude, poiId]
    );
    await query(
      `UPDATE zones
       SET name = ?, description = ?, latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude),
           pending_name = NULL, pending_description = NULL, pending_cover_image_url = NULL,
           pending_latitude = NULL, pending_longitude = NULL, approval_status = 'APPROVED', updated_at = NOW()
       WHERE id = ?`,
      [pending_name, pending_description, pending_latitude, pending_longitude, poiId]
    );
    
    // Update or insert media files
    if (pending_cover_image_url) {
      const meta = await query<any[]>(
        `SELECT stall_id, (SELECT vendor_id FROM stalls WHERE id = stall_id) AS vendor_id FROM zones WHERE id = ? LIMIT 1`,
        [poiId]
      );
      const vendorId = meta[0]?.vendor_id ? String(meta[0].vendor_id) : null;
      const stallId = meta[0]?.stall_id ? String(meta[0].stall_id) : null;
      
      const media = await query<any[]>(
        `SELECT id FROM media_files
         WHERE poi_id = ? AND file_type = 'IMAGE' AND public_url = ?
         ORDER BY id DESC LIMIT 1`,
        [poiId, pending_cover_image_url]
      );
      if (media.length > 0) {
        await query(
          `UPDATE media_files SET public_url = ?, moderation_status = 'APPROVED', moderated_at = NOW(), updated_at = NOW() WHERE id = ?`,
          [pending_cover_image_url, media[0].id]
        );
      } else if (vendorId) {
        await query(
          `INSERT INTO media_files (vendor_id, stall_id, poi_id, file_type, storage_provider, file_name, file_path, public_url, mime_type, file_size, moderation_status)
           VALUES (?, ?, ?, 'IMAGE', 'LOCAL', 'cover.jpg', '', ?, 'image/jpeg', 0, 'APPROVED')`,
          [vendorId, stallId, poiId, pending_cover_image_url]
        );
      }
    }
    await query(
      `UPDATE media_files
       SET moderation_status = 'APPROVED', moderated_at = NOW(), updated_at = NOW()
       WHERE poi_id = ? AND public_url = ? AND moderation_status = 'PENDING'`,
      [poiId, pending_cover_image_url]
    );
    
    res.json(ok({ success: true, message: 'Duyệt chỉnh sửa thành công' }));
  })
);

router.post(
  '/:id/reject',
  asyncHandler(async (req, res) => {
    const poiId = req.params.id;
    if (poiId.startsWith('stall-')) {
      const stallId = poiId.slice('stall-'.length);
      await query(
        `UPDATE stalls
         SET pending_name = NULL, pending_description = NULL, pending_cover_image_url = NULL,
             pending_latitude = NULL, pending_longitude = NULL, approval_status = 'APPROVED', updated_at = NOW()
         WHERE id = ?`,
        [stallId]
      );
      await query(
        `UPDATE media_files SET moderation_status = 'REJECTED', moderated_at = NOW(), updated_at = NOW()
         WHERE stall_id = ? AND moderation_status = 'PENDING'`,
        [stallId]
      );
      return res.json(ok({ success: true, entityType: 'STALL' }));
    }
    // Discard pending changes
    await query(
      `UPDATE pois SET pending_name = NULL, pending_description = NULL, pending_cover_image_url = NULL,
       pending_latitude = NULL, pending_longitude = NULL, approval_status = 'APPROVED', updated_at = NOW() WHERE id = ?`,
      [poiId]
    );
    await query(
      `UPDATE zones SET pending_name = NULL, pending_description = NULL, pending_cover_image_url = NULL,
       pending_latitude = NULL, pending_longitude = NULL, approval_status = 'APPROVED', updated_at = NOW() WHERE id = ?`,
      [poiId]
    );
    await query(
      `UPDATE media_files SET moderation_status = 'REJECTED', moderated_at = NOW(), updated_at = NOW()
       WHERE poi_id = ? AND moderation_status = 'PENDING'`,
      [poiId]
    );
    res.json(ok({ success: true, message: 'Từ chối chỉnh sửa thành công' }));
  })
);

export default router;
