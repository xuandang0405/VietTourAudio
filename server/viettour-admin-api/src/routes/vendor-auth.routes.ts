import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { vendorLogin, vendorLogout, vendorMe, vendorRefresh } from '../controllers/vendor-auth.controller';

export const router = Router({ strict: true });

router.post('/login', vendorLogin);
router.post('/refresh', vendorRefresh);
router.post('/logout', authenticate, vendorLogout);
router.get('/me', authenticate, vendorMe);

export default router;