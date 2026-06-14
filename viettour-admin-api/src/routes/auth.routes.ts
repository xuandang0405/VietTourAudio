import { Router } from 'express';
import { login, logout, me, refresh } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export const router = Router({ strict: true });

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
