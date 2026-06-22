import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { parsePagination } from '../utils/pagination.js';
import { writeAuditLog } from '../services/audit.service.js';

const upsertZoneSchema = z.object({
  shopId: z.coerce.number().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  radius: z.coerce.number().int().min(1).default(10),
  zoneType: z.enum(['LANDMARK', 'RESTAURANT', 'BAR', 'SHOP', 'OTHER']).default('LANDMARK'),
  isPremium: z.boolean().optional(),
  activeTime: z.enum(['ALL', 'DAY', 'NIGHT']).default('ALL'),
  translations: z.array(z.object({ language: z.string().min(2).max(5), title: z.string().optional(), description: z.string().min(1) })).default([])
});

export async function listZones(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { lang, tourId, shopId, zoneType, nearLat, nearLng } = req.query;

  const where = {
    isActive: true,
    ...(tourId ? { tourZones: { some: { tourId: Number(tourId) } } } : {}),
    ...(shopId ? { shopId: Number(shopId) } : {}),
    ...(zoneType ? { zoneType } : {})
  };

  const [items, total] = await Promise.all([
    prisma.zone.findMany({
      where,
      include: { translations: true, narrations: true, shop: { include: { hours: true } } },
      skip,
      take: limit,
      orderBy: { orderIndex: 'asc' }
    }),
    prisma.zone.count({ where })
  ]);

  let data = items;
  if (nearLat && nearLng) {
    // fallback đơn giản: sort gần đúng bằng sai khác tọa độ
    data = [...items].sort((a, b) => {
      const da = Math.abs(Number(a.latitude) - Number(nearLat)) + Math.abs(Number(a.longitude) - Number(nearLng));
      const db = Math.abs(Number(b.latitude) - Number(nearLat)) + Math.abs(Number(b.longitude) - Number(nearLng));
      return da - db;
    });
  }

  if (lang) {
    data = data.map((z) => {
      const tr = z.translations.find((t) => t.language === lang) || z.translations.find((t) => t.language === 'vi');
      return {
        ...z,
        localizedTitle: tr?.title || z.name,
        localizedDescription: tr?.description || z.description
      };
    });
  }

  return res.json({ page, limit, total, items: data });
}

export async function getZoneById(req, res) {
  const id = Number(req.params.id);
  const item = await prisma.zone.findUnique({
    where: { id },
    include: {
      translations: true,
      narrations: true,
      shop: { include: { hours: true } }
    }
  });
  if (!item) return res.status(404).json({ error: 'Zone not found' });
  return res.json(item);
}

export async function getZonesByTour(req, res) {
  const tourId = Number(req.params.tourId);
  const tourZones = await prisma.tourZone.findMany({
    where: { tourId },
    include: { zone: { include: { translations: true, narrations: true } } },
    orderBy: { orderIndex: 'asc' }
  });
  return res.json({ items: tourZones.map((x) => ({ ...x.zone, orderIndex: x.orderIndex })) });
}

export async function createZone(req, res) {
  const payload = upsertZoneSchema.parse(req.body);
  const item = await prisma.zone.create({
    data: {
      shopId: payload.shopId ?? null,
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl,
      latitude: payload.latitude,
      longitude: payload.longitude,
      radius: payload.radius,
      zoneType: payload.zoneType,
      isPremium: payload.isPremium ?? false,
      activeTime: payload.activeTime,
      translations: {
        create: payload.translations
      }
    },
    include: { translations: true }
  });
  return res.status(201).json(item);
}

export async function updateZone(req, res) {
  const id = Number(req.params.id);
  const payload = upsertZoneSchema.parse(req.body);

  await prisma.zone.update({
    where: { id },
    data: {
      shopId: payload.shopId ?? null,
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl,
      latitude: payload.latitude,
      longitude: payload.longitude,
      radius: payload.radius,
      zoneType: payload.zoneType,
      isPremium: payload.isPremium ?? false,
      activeTime: payload.activeTime
    }
  });

  await prisma.zoneTranslation.deleteMany({ where: { zoneId: id } });
  if (payload.translations.length) {
    await prisma.zoneTranslation.createMany({
      data: payload.translations.map((x) => ({
        zoneId: id,
        language: x.language,
        title: x.title,
        description: x.description
      }))
    });
  }

  const item = await prisma.zone.findUnique({ where: { id }, include: { translations: true } });
  return res.json(item);
}

export async function deleteZone(req, res) {
  const id = Number(req.params.id);
  await prisma.zone.update({ where: { id }, data: { isActive: false } });
  return res.json({ success: true });
}

export async function lockZone(req, res) {
  const id = Number(req.params.id);
  const body = z.object({ lock: z.boolean(), reason: z.string().optional() }).parse(req.body);

  const before = await prisma.zone.findUnique({ where: { id } });
  const item = await prisma.zone.update({
    where: { id },
    data: {
      isLocked: body.lock,
      lockReason: body.reason || null
    }
  });

  await writeAuditLog({
    actorUserId: req.user?.id,
    action: body.lock ? 'zone.lock' : 'zone.unlock',
    entityType: 'Zone',
    entityId: id,
    reason: body.reason,
    beforeData: before,
    afterData: item
  });

  return res.json(item);
}
