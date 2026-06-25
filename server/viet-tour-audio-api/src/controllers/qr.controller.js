import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { createQrLink, scanQr } from '../services/qr.service.js';
import { trackEvent } from '../services/analytics.service.js';
import { sha256 } from '../utils/crypto.js';
import { randomUUID } from 'node:crypto';

const createSchema = z.object({
  targetType: z.enum(['app', 'tour', 'zone', 'shop', 'campaign']),
  targetId: z.coerce.number(),
  label: z.string().optional(),
  maxUses: z.coerce.number().optional(),
  expiresAt: z.string().datetime().optional()
});

export async function listQr(req, res) {
  const items = await prisma.qrDeepLink.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json({ items });
}

export async function createQr(req, res) {
  const payload = createSchema.parse(req.body);
  const data = await createQrLink(payload);
  return res.status(201).json(data);
}

export async function disableQr(req, res) {
  const id = Number(req.params.id);
  const item = await prisma.qrDeepLink.update({ where: { id }, data: { isActive: false } });
  return res.json(item);
}

export async function regenerateQr(req, res) {
  const id = Number(req.params.id);
  const old = await prisma.qrDeepLink.findUnique({ where: { id } });
  if (!old) return res.status(404).json({ error: 'QR not found' });

  const token = randomUUID().replace(/-/g, '');
  const updated = await prisma.qrDeepLink.update({
    where: { id },
    data: {
      tokenHash: sha256(token),
      tokenPreview: token.slice(0, 12),
      currentUses: 0,
      isActive: true
    }
  });

  return res.json({ ...updated, token });
}

export async function scan(req, res) {
  const token = String(req.params.token || '');
  const sessionId = String(req.query.sessionId || randomUUID());
  const ipHash = sha256(req.ip || req.headers['x-forwarded-for'] || 'na');

  const result = await scanQr({ token, sessionId, ipHash });
  if (!result.valid) return res.status(404).json(result);

  await trackEvent({
    sessionId,
    actionType: 'QRScan',
    guestId: String(req.query.guestId || ''),
    metadata: { token: token.slice(0, 8), cooldown: result.cooldown }
  });

  return res.json({ ...result, sessionId });
}

export async function scanPost(req, res) {
  const token = String(req.body.token || '');
  const guestId = String(req.body.guestId || '');
  const sessionId = String(req.headers['x-session-id'] || randomUUID());
  const ipHash = sha256(req.ip || req.headers['x-forwarded-for'] || 'na');

  const result = await scanQr({ token, sessionId, ipHash });
  if (!result.valid) return res.status(404).json({ error: result.reason || 'QR not found' });

  await trackEvent({
    sessionId,
    actionType: 'QRScan',
    guestId,
    metadata: { token: token.slice(0, 8), cooldown: result.cooldown }
  });

  if (result.targetType === 'tour') {
    return res.json({
      session: { id: sessionId },
      tour: result.data.tour,
      zones: result.data.zones || []
    });
  }

  return res.json({
    session: { id: sessionId },
    ...result.data
  });
}
