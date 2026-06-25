import { Router, Request, Response } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { translateText } from '../utils/translator';

export const router = Router();
const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate, authorize(...allowedRoles));

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { text, targetLangs } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, error: 'Text must be a non-empty string' });
      return;
    }
    if (!targetLangs || !Array.isArray(targetLangs)) {
      res.status(400).json({ success: false, error: 'targetLangs must be an array of strings' });
      return;
    }

    const translations: Record<string, string> = {};

    await Promise.all(
      targetLangs.map(async (lang) => {
        try {
          translations[lang] = await translateText(text, lang);
        } catch (err: any) {
          console.error(`Translation to ${lang} failed:`, err.message);
          translations[lang] = ''; // Safe fallback
        }
      })
    );

    res.json({ success: true, data: translations });
  })
);

export default router;
