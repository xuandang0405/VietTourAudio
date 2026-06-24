import { z } from 'zod';
import { checkGeofence } from '../services/geofence.service.js';
import { trackEvent } from '../services/analytics.service.js';

const schema = z.object({
  guestId: z.string().optional(),
  sessionId: z.string().min(3),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  accuracy: z.coerce.number().default(10),
  tourId: z.coerce.number().optional(),
  lang: z.string().optional()
});

export async function check(req, res) {
  const payload = schema.parse(req.body);
  const result = await checkGeofence(payload);

  if (result.nearest && result.inside) {
    await trackEvent({
      sessionId: payload.sessionId,
      guestId: payload.guestId,
      zoneId: result.nearest.id,
      actionType: result.narration ? 'PlayNarration' : 'EnterZone',
      language: payload.lang || 'vi',
      latitude: payload.lat,
      longitude: payload.lng,
      metadata: { cooldown: result.cooldown, remainingMs: result.remainingMs }
    });
  }

  return res.json(result);
}
