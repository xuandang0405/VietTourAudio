import { z } from 'zod';
import { prisma } from '../config/prisma.js';

export async function getSettings(req, res) {
  const items = await prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  return res.json({ items });
}

export async function upsertSetting(req, res) {
  const payload = z.object({ key: z.string().min(1), value: z.string().optional() }).parse(req.body);
  const item = await prisma.appSetting.upsert({
    where: { key: payload.key },
    create: { key: payload.key, value: payload.value },
    update: { value: payload.value }
  });
  return res.json(item);
}
