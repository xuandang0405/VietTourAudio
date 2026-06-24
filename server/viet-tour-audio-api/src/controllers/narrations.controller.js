import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { generateAudio } from '../services/tts.service.js';
import { notifyUser } from '../services/notification.service.js';

const narrationSchema = z.object({
  zoneId: z.coerce.number(),
  language: z.string().min(2).max(5),
  text: z.string().min(3),
  voiceId: z.string().optional()
});

export async function getByZone(req, res) {
  const zoneId = Number(req.params.zoneId);
  const lang = String(req.query.lang || 'vi').slice(0, 5);

  const data = await prisma.narration.findFirst({
    where: {
      zoneId,
      language: lang,
      approvalStatus: 'APPROVED',
      audioStatus: 'READY'
    }
  }) || await prisma.narration.findFirst({
    where: {
      zoneId,
      language: 'vi',
      approvalStatus: 'APPROVED',
      audioStatus: 'READY'
    }
  });

  return res.json({ item: data });
}

export async function createNarration(req, res) {
  const payload = narrationSchema.parse(req.body);

  const zone = await prisma.zone.findUnique({ where: { id: payload.zoneId } });
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  if (req.user.role === 'VENDOR' && req.user.shopId !== zone.shopId) {
    return res.status(403).json({ error: 'Vendor can only manage own shop zones' });
  }

  const item = await prisma.narration.upsert({
    where: { zoneId_language: { zoneId: payload.zoneId, language: payload.language } },
    create: {
      zoneId: payload.zoneId,
      language: payload.language,
      text: payload.text,
      voiceId: payload.voiceId,
      approvalStatus: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
      audioStatus: 'PENDING',
      updatedById: req.user.id
    },
    update: {
      text: payload.text,
      voiceId: payload.voiceId,
      approvalStatus: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
      audioStatus: 'PENDING',
      updatedById: req.user.id,
      rejectReason: null
    }
  });

  return res.status(201).json(item);
}

export async function updateNarration(req, res) {
  const id = Number(req.params.id);
  const payload = narrationSchema.partial().parse(req.body);
  const itemOld = await prisma.narration.findUnique({ where: { id }, include: { zone: true } });
  if (!itemOld) return res.status(404).json({ error: 'Narration not found' });

  if (req.user.role === 'VENDOR' && req.user.shopId !== itemOld.zone.shopId) {
    return res.status(403).json({ error: 'Vendor can only edit own shop narrations' });
  }

  const item = await prisma.narration.update({
    where: { id },
    data: {
      ...payload,
      ...(req.user.role === 'VENDOR' ? { approvalStatus: 'PENDING', audioStatus: 'PENDING' } : {}),
      updatedById: req.user.id
    }
  });

  return res.json(item);
}

export async function approveNarration(req, res) {
  const id = Number(req.params.id);
  const item = await prisma.narration.update({
    where: { id },
    data: {
      approvalStatus: 'APPROVED',
      rejectReason: null,
      audioStatus: 'PENDING',
      updatedById: req.user.id
    },
    include: { zone: true }
  });

  const result = await generateAudio({
    narrationId: item.id,
    text: item.text,
    language: item.language,
    voiceId: item.voiceId
  });

  await notifyUser({
    recipientRole: 'VENDOR',
    shopId: item.zone?.shopId,
    message: result.ok
      ? `Narration #${item.id} approved and audio generated`
      : `Narration #${item.id} approved but TTS failed: ${result.error}`
  });

  if (req.io && result.ok) {
    req.io.emit('narration:approved', {
      narrationId: item.id,
      zoneId: item.zoneId,
      language: item.language,
      fileUrl: result.fileUrl
    });
  }

  return res.json({ success: true, result });
}

export async function rejectNarration(req, res) {
  const id = Number(req.params.id);
  const { reason } = z.object({ reason: z.string().min(3).max(500) }).parse(req.body);

  const item = await prisma.narration.update({
    where: { id },
    data: {
      approvalStatus: 'REJECTED',
      rejectReason: reason,
      updatedById: req.user.id
    },
    include: { zone: true }
  });

  await notifyUser({
    recipientRole: 'VENDOR',
    shopId: item.zone?.shopId,
    message: `Narration #${item.id} rejected: ${reason}`
  });

  return res.json(item);
}

export async function listPending(req, res) {
  const items = await prisma.narration.findMany({
    where: { approvalStatus: 'PENDING' },
    include: { zone: true },
    orderBy: { updatedAt: 'desc' }
  });
  return res.json({ items });
}
