import { Request, Response } from 'express';
import { z } from 'zod';
import { PoiService, TourService } from '../services/poi.service';
import { ok } from '../types/api.types';
import { toBigIntId } from '../utils/serialization';

const translationItemSchema = z.object({
  lang: z.string(),
  title: z.string(),
  ttsScript: z.string(),
});

const createPoiSchema = z.object({
  tourId: z.union([z.number(), z.string()]),
  stallId: z.union([z.number(), z.string()]),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
  activationRadius: z.number().optional(),
  isPremiumContent: z.boolean(),
  status: z.string().optional(),
  translations: z.array(translationItemSchema).optional(),
});

const updatePoiSchema = z.object({
  tourId: z.union([z.number(), z.string()]),
  stallId: z.union([z.number(), z.string()]),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
  activationRadius: z.number(),
  isPremiumContent: z.boolean(),
  status: z.string(),
  translations: z.array(translationItemSchema).optional(),
});

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

export class PoiController {
  private poiService = new PoiService();

  getAllPois = async (req: Request, res: Response): Promise<void> => {
    // [UC08] View Nearby POI & Audio Playback
    const pois = await this.poiService.getAllPois(req);
    res.json(ok(pois));
  };

  getAllStalls = async (req: Request, res: Response): Promise<void> => {
    const stalls = await this.poiService.getAllStalls(req);
    res.json(ok(stalls));
  };

  getActiveZones = async (req: Request, res: Response): Promise<void> => {
    const zones = await this.poiService.getActiveZones();
    res.json(ok(zones));
  };

  getDistance = async (req: Request, res: Response): Promise<void> => {
    const poi1Id = toBigIntId(String(req.query.poi1_id ?? ''), 'poi1_id');
    const poi2Id = toBigIntId(String(req.query.poi2_id ?? ''), 'poi2_id');

    const distance = await this.poiService.getDistance(poi1Id, poi2Id, req);
    if (distance === null) {
      res.status(404).json({ success: false, error: 'POIs not found' });
      return;
    }
    res.json(ok({ distanceMeters: distance }));
  };

  getGuestPois = async (req: Request, res: Response): Promise<void> => {
    const rawZoneCode = req.query.zone_code;
    const zoneCode = (typeof rawZoneCode === 'string' ? rawZoneCode : '').trim();
    const rawLang = req.query.lang;
    const lang = (typeof rawLang === 'string' ? rawLang : 'vi').trim();
    const rawActiveTourId = req.query.activeTourId || req.query.tourId;
    const activeTourId = typeof rawActiveTourId === 'string' ? rawActiveTourId.trim() : undefined;

    const normalizedLang = ['vi', 'en', 'ja', 'ko', 'zh'].includes(lang) ? lang : 'vi';

    const translations: Record<string, Record<string, string>> = {
      vi: {
        'error.zone_code_required': 'Mã khu vực (zone_code) là bắt buộc.',
        'error.invalid_zone_code': 'Mã khu vực không hợp lệ.',
        'error.no_pois_found': 'Không tìm thấy điểm tham quan nào cho mã khu vực này.',
        'error.database_error': 'Lỗi kết nối cơ sở dữ liệu.'
      },
      en: {
        'error.zone_code_required': 'Zone code (zone_code) is required.',
        'error.invalid_zone_code': 'Invalid zone code.',
        'error.no_pois_found': 'No POIs found for this zone code.',
        'error.database_error': 'Database connection error.'
      },
      ja: {
        'error.zone_code_required': 'ゾーンコード（zone_code）が必要です。',
        'error.invalid_zone_code': '無効なゾーンコードです。',
        'error.no_pois_found': 'このゾーンコードの観光スポットが見つかりません。',
        'error.database_error': 'データベース接続エラー。'
      },
      ko: {
        'error.zone_code_required': '구역 코드(zone_code)가 필요합니다.',
        'error.invalid_zone_code': '유효하지 않은 구역 코드입니다.',
        'error.no_pois_found': '이 구역 코드에 대한 관광명소를 찾을 수 없습니다.',
        'error.database_error': '데이터베이스 연결 오류입니다.'
      },
      zh: {
        'error.zone_code_required': '区域代码 (zone_code) 是必需的。',
        'error.invalid_zone_code': '无效的区域代码。',
        'error.no_pois_found': '未找到该区域代码 of 景点。',
        'error.database_error': '数据库连接错误。'
      }
    };

    const t = (key: string): string => {
      return translations[normalizedLang]?.[key] ?? translations['vi']?.[key] ?? key;
    };

    if (!zoneCode) {
      res.status(400).json({ success: false, error: t('error.zone_code_required') });
      return;
    }

    try {
      const pois = await this.poiService.getGuestPois(zoneCode, normalizedLang, activeTourId);
      if (pois.length === 0) {
        console.log(t('error.no_pois_found'));
      }
      res.json(ok(pois));
    } catch (err: any) {
      console.error(t('error.database_error'), err);
      res.status(500).json({ success: false, error: t('error.database_error') });
    }
  };

  createPoi = async (req: Request, res: Response): Promise<void> => {
    const parsed = createPoiSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid request body', details: parsed.error.format() });
      return;
    }

    try {
      const slug = parsed.data.slug && parsed.data.slug.trim()
        ? slugify(parsed.data.slug)
        : slugify(parsed.data.name);

      // Strip out any explicit 'id' to prevent primary key allocation collisions
      const { id, ...creationData } = parsed.data as any;

      const poi = await this.poiService.createPoi(req, {
        ...creationData,
        slug,
      });

      req.auditMeta = {
        action: 'CREATE_POI',
        targetType: 'pois',
        targetId: BigInt(poi.id),
        beforeData: null,
        afterData: poi,
      };

      res.json(ok(poi));
    } catch (err: any) {
      res.status(err.message.includes('zone') ? 403 : 400).json({ success: false, error: err.message });
    }
  };

  updatePoi = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'poi id');
    const parsed = updatePoiSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid request body', details: parsed.error.format() });
      return;
    }

    try {
      const before = await this.poiService.getPoiRow(id, req);
      if (!before) {
        res.status(404).json({ success: false, error: 'POI not found' });
        return;
      }

      const slug = parsed.data.slug && parsed.data.slug.trim()
        ? slugify(parsed.data.slug)
        : slugify(parsed.data.name);
      const poi = await this.poiService.updatePoi(id, req, {
        ...parsed.data,
        slug,
      });

      req.auditMeta = {
        action: 'UPDATE_POI',
        targetType: 'pois',
        targetId: id,
        beforeData: before,
        afterData: poi,
      };

      res.json(ok(poi));
    } catch (err: any) {
      res.status(err.message.includes('zone') ? 403 : 400).json({ success: false, error: err.message });
    }
  };

  deletePoi = async (req: Request, res: Response): Promise<void> => {
    const id = toBigIntId(req.params.id, 'poi id');
    const incomingReason = typeof req.body?.reason === 'string' ? req.body.reason : (typeof req.query?.reason === 'string' ? req.query.reason : '');
    const reason = incomingReason.trim() ? incomingReason.trim() : "Không có lý do được cung cấp";

    try {
      const { before, after } = await this.poiService.deletePoi(id, req);

      req.auditMeta = {
        action: 'DELETE_POI',
        targetType: 'pois',
        targetId: id,
        reason,
        beforeData: before,
        afterData: after,
      };

      res.json(ok({ success: true }));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };
}

const createTourSchema = z.object({
  vendorId: z.union([z.number(), z.string()]),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  isPremium: z.boolean().optional(),
  latitude: z.union([z.number(), z.string()]).nullable().optional(),
  longitude: z.union([z.number(), z.string()]).nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
});

const updateTourSchema = z.object({
  vendorId: z.union([z.number(), z.string()]),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.string(),
  isPremium: z.boolean(),
  latitude: z.union([z.number(), z.string()]).nullable().optional(),
  longitude: z.union([z.number(), z.string()]).nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
});

export class TourController {
  private tourService = new TourService();

  getAllTours = async (_req: Request, res: Response): Promise<void> => {
    const tours = await this.tourService.getAllTours();
    res.json(ok(tours));
  };

  getTour = async (req: Request, res: Response): Promise<void> => {
    const idStr = req.params.id as string;
    const zoneId = parseInt(idStr, 10);
    if (isNaN(zoneId)) {
      res.status(400).json({ success: false, error: 'Invalid Zone ID format' });
      return;
    }

    try {
      const tour = await this.tourService.getTourById(BigInt(zoneId));
      res.json(ok(tour));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  createTour = async (req: Request, res: Response): Promise<void> => {
    const parsed = createTourSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid request body', details: parsed.error.format() });
      return;
    }

    try {
      const tour = await this.tourService.createTour(parsed.data);

      req.auditMeta = {
        action: 'CREATE_TOUR',
        targetType: 'tours',
        targetId: BigInt(tour.id),
        beforeData: null,
        afterData: tour,
      };

      res.json(ok(tour));
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  updateTour = async (req: Request, res: Response): Promise<void> => {
    const idStr = req.params.id as string;
    const zoneId = parseInt(idStr, 10);
    if (isNaN(zoneId)) {
      res.status(400).json({ success: false, error: 'Invalid Zone ID format' });
      return;
    }
    const parsed = updateTourSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid request body', details: parsed.error.format() });
      return;
    }

    try {
      const tour = await this.tourService.updateTour(BigInt(zoneId), parsed.data);

      req.auditMeta = {
        action: 'UPDATE_TOUR',
        targetType: 'tours',
        targetId: BigInt(zoneId),
        beforeData: null,
        afterData: tour,
      };

      res.json(ok(tour));
    } catch (err: any) {
      res.status(err.message.includes('not found') ? 404 : 400).json({ success: false, error: err.message });
    }
  };

  deleteTour = async (req: Request, res: Response): Promise<void> => {
    const idStr = req.params.id as string;
    const zoneId = parseInt(idStr, 10);
    if (isNaN(zoneId)) {
      res.status(400).json({ success: false, error: 'Invalid Zone ID format' });
      return;
    }

    const incomingReason = typeof req.body?.reason === 'string' ? req.body.reason : (typeof req.query?.reason === 'string' ? req.query.reason : '');
    const reason = incomingReason.trim() ? incomingReason.trim() : "Không có lý do được cung cấp";

    try {
      await this.tourService.deleteTour(BigInt(zoneId));

      req.auditMeta = {
        action: 'DELETE_TOUR',
        targetType: 'tours',
        targetId: BigInt(zoneId),
        reason,
        beforeData: null,
        afterData: null,
      };

      res.json(ok({ success: true }));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  resetTourQr = async (req: Request, res: Response): Promise<void> => {
    const idStr = req.params.id as string;
    const zoneId = parseInt(idStr, 10);
    if (isNaN(zoneId)) {
      res.status(400).json({ success: false, error: 'Invalid Zone ID format' });
      return;
    }

    try {
      const result = await this.tourService.resetTourQr(BigInt(zoneId));
      res.json(ok(result));
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };
}
