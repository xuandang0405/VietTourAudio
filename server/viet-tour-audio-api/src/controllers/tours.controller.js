import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { parsePagination } from '../utils/pagination.js';

const tourSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  duration: z.coerce.number().int().optional(),
  priceAmount: z.coerce.number().default(30000),
  currency: z.string().default('VND'),
  isActive: z.boolean().optional(),
  translations: z.array(z.object({ language: z.string().min(2).max(5), name: z.string().min(1), description: z.string().optional() })).default([]),
  zones: z.array(z.object({ zoneId: z.coerce.number(), orderIndex: z.coerce.number().int().default(0) })).default([])
});

export async function listTours(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { isActive: true };

  const [items, total] = await Promise.all([
    prisma.tour.findMany({
      where,
      include: { translations: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.tour.count({ where })
  ]);

  return res.json({ page, limit, total, items });
}

export async function getTour(req, res) {
  const id = Number(req.params.id);
  const item = await prisma.tour.findUnique({
    where: { id },
    include: {
      translations: true,
      tourZones: {
        include: {
          zone: {
            include: { translations: true, narrations: true }
          }
        },
        orderBy: { orderIndex: 'asc' }
      }
    }
  });
  if (!item) return res.status(404).json({ error: 'Tour not found' });

  const tourData = { ...item };
  delete tourData.tourZones;

  return res.json({
    tour: tourData,
    zones: item.tourZones.map((x) => ({ ...x.zone, orderIndex: x.orderIndex }))
  });
}

export async function createTour(req, res) {
  const payload = tourSchema.parse(req.body);
  const item = await prisma.tour.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      imageUrl: payload.imageUrl,
      duration: payload.duration,
      priceAmount: payload.priceAmount,
      currency: payload.currency,
      isActive: payload.isActive ?? true,
      translations: { create: payload.translations },
      tourZones: { create: payload.zones.map((x) => ({ zoneId: x.zoneId, orderIndex: x.orderIndex })) }
    },
    include: { translations: true, tourZones: true }
  });
  return res.status(201).json(item);
}

export async function updateTour(req, res) {
  const id = Number(req.params.id);
  const payload = tourSchema.parse(req.body);

  await prisma.tour.update({
    where: { id },
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      imageUrl: payload.imageUrl,
      duration: payload.duration,
      priceAmount: payload.priceAmount,
      currency: payload.currency,
      isActive: payload.isActive ?? true
    }
  });

  await prisma.tourTranslation.deleteMany({ where: { tourId: id } });
  await prisma.tourZone.deleteMany({ where: { tourId: id } });

  if (payload.translations.length) {
    await prisma.tourTranslation.createMany({
      data: payload.translations.map((t) => ({ ...t, tourId: id }))
    });
  }

  if (payload.zones.length) {
    await prisma.tourZone.createMany({
      data: payload.zones.map((z) => ({ tourId: id, zoneId: z.zoneId, orderIndex: z.orderIndex }))
    });
  }

  return getTour(req, res);
}

export async function deleteTour(req, res) {
  const id = Number(req.params.id);
  await prisma.tour.update({ where: { id }, data: { isActive: false } });
  return res.json({ success: true });
}
