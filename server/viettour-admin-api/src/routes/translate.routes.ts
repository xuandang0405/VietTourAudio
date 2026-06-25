import { Router, Request, Response } from 'express';
import { UserRole } from '../types/domain';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const router = Router();
const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

router.use(authenticate, authorize(...allowedRoles));

async function translateText(text: string, targetLang: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Translate returned HTTP ${response.status}`);
  }
  const data = await response.json();
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0].map((x: any) => x[0]).join('');
  }
  throw new Error('Failed to parse translation response');
}

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
