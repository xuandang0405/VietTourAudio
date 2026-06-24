import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { trackEvent } from '../services/analytics.service.js';

const syncSchema = z.object({
  guestId: z.string().min(2),
  ops: z.array(z.object({ zoneId: z.coerce.number(), action: z.enum(['add', 'remove']) }))
});

export async function getFavorites(req, res) {
  const guestId = String(req.params.guestId);
  const items = await prisma.guestFavorite.findMany({
    where: { guestId },
    include: { zone: { include: { translations: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return res.json({ items });
}

export async function syncFavorites(req, res) {
  const payload = syncSchema.parse(req.body);

  for (const op of payload.ops) {
    if (op.action === 'add') {
      await prisma.guestFavorite.upsert({
        where: { guestId_zoneId: { guestId: payload.guestId, zoneId: op.zoneId } },
        create: { guestId: payload.guestId, zoneId: op.zoneId },
        update: {}
      });
      await trackEvent({ sessionId: payload.guestId, guestId: payload.guestId, zoneId: op.zoneId, actionType: 'Favorite' });
    } else {
      await prisma.guestFavorite.deleteMany({ where: { guestId: payload.guestId, zoneId: op.zoneId } });
    }
  }

  const items = await prisma.guestFavorite.findMany({ where: { guestId: payload.guestId } });
  return res.json({ items });
}
