import { Router } from 'express';
import { login, me, refresh, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
