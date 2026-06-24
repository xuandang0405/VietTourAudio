import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/domain';
import { query } from '../lib/db';
import { ok } from '../types/api.types';
import { asyncHandler } from '../utils/asyncHandler';
import { toBigIntId } from '../utils/serialization';
import { buildStallZoneScope } from '../utils/zoneScope';

export const router = Router();

const adminManagers = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate, authorize(...adminManagers));

function generateAlphanumericCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

router.put(
  '/:id/qr/reset',
  asyncHandler(async (req, res) => {
    const id = toBigIntId(req.params.id, 'stall id');
    const zoneScope = buildStallZoneScope(req);
    
    // Check if stall exists
    const stallRows = await query<any[]>(
      `SELECT id, name, zone_code FROM stalls s WHERE id = ? ${zoneScope.clause} LIMIT 1`,
      [id.toString(), ...zoneScope.params]
    );
    
    if (stallRows.length === 0) {
      res.status(404).json({ success: false, error: 'Stall not found' });
      return;
    }
    
    const newCode = generateAlphanumericCode(8);
    
    await query(
      'UPDATE stalls SET zone_code = ?, updated_at = NOW() WHERE id = ?',
      [newCode, id.toString()]
    );
    
    res.json(ok({ zoneCode: newCode }));
  })
);

export default router;
