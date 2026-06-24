import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getFavorites, syncFavorites } from '../controllers/favorites.controller.js';

const router = Router();

router.get('/:guestId', asyncHandler(getFavorites));
router.post('/sync', asyncHandler(syncFavorites));

export default router;
