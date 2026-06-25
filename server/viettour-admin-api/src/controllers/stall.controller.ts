import { Request, Response } from 'express';
import { z } from 'zod';
import { StallService } from '../services/stall.service';
import { ok } from '../types/api.types';
import { toBigIntId } from '../utils/serialization';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const createStallSchema = z.object({
  vendorId: z.union([z.number(), z.string()]),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  activationRadius: z.number().optional(),
  openingHours: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  priorityScore: z.number().optional(),
  status: z.string().optional(),
  zoneCode: z.string().nullable().optional(),
});

export class StallController {
  private stallService = new StallService();

  resetStallQr = async (req: Request, res: Response): Promise<void> => {
    // [UC38] Scan QR Code
    const id = toBigIntId(req.params.id, 'stall id');
    try {
      const newCode = await this.stallService.resetStallQr(id, req);
      res.json(ok({ zoneCode: newCode }));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  createStall = async (req: Request, res: Response): Promise<void> => {
    const parsed = createStallSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid request body', details: parsed.error.format() });
      return;
    }

    try {
      const slug = parsed.data.slug && parsed.data.slug.trim()
        ? slugify(parsed.data.slug)
        : slugify(parsed.data.name);

      const stallId = await this.stallService.createStall({
        ...parsed.data,
        slug,
      });

      res.json(ok({ id: stallId.toString() }));
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
