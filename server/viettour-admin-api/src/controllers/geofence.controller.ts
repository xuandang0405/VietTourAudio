import { Request, Response } from 'express';
import { z } from 'zod';
import { GeofenceService } from '../services/geofence.service';
import { ok } from '../types/api.types';

const checkOverlapSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  activationRadius: z.number().positive().optional(),
  radius: z.number().positive().optional(),
});

export class GeofenceController {
  private geofenceService = new GeofenceService();

  all = async (req: Request, res: Response): Promise<void> => {
    const stalls = await this.geofenceService.getStallsWithOverlaps(req);
    res.json(ok(stalls));
  };

  allData = async (req: Request, res: Response): Promise<void> => {
    // [UC08] View Nearby POI & Audio Playback
    const data = await this.geofenceService.getAllGeofenceData(req);
    res.json(ok(data));
  };

  checkOverlap = async (req: Request, res: Response): Promise<void> => {
    const parsed = checkOverlapSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'latitude, longitude and radius are required', details: parsed.error.format() });
      return;
    }

    const { latitude, longitude, activationRadius, radius } = parsed.data;
    const r = activationRadius ?? radius ?? 10;

    const result = await this.geofenceService.checkOverlap(latitude, longitude, r, req);
    res.json(ok(result));
  };
}
