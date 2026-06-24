import { Request } from 'express';
import { UserRole } from '../types/domain';

export function getAssignedZoneId(req: Request): string | null {
  if (req.user?.role !== UserRole.ADMIN || req.user.assignedZoneId == null) {
    return null;
  }

  return req.user.assignedZoneId.toString();
}

export function buildPoiZoneScope(req: Request, stallAlias = 's'): { clause: string; params: string[] } {
  const assignedZoneId = getAssignedZoneId(req);
  if (!assignedZoneId) {
    return { clause: '', params: [] };
  }

  return {
    clause: ` AND EXISTS (
      SELECT 1
      FROM zones z_scope
      WHERE z_scope.id = ? AND z_scope.zone_code = ${stallAlias}.zone_code
    )`,
    params: [assignedZoneId]
  };
}

export function buildStallZoneScope(req: Request, stallAlias = 's'): { clause: string; params: string[] } {
  const assignedZoneId = getAssignedZoneId(req);
  if (!assignedZoneId) {
    return { clause: '', params: [] };
  }

  return {
    clause: ` AND EXISTS (
      SELECT 1
      FROM zones z_scope
      WHERE z_scope.id = ? AND z_scope.zone_code = ${stallAlias}.zone_code
    )`,
    params: [assignedZoneId]
  };
}

