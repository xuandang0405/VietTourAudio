import { Router } from 'express';
import { auth, requireRoles } from '../middleware/auth.js';
import { audioUpload, imageUpload } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { removeMedia, uploadAudio, uploadImage } from '../controllers/uploads.controller.js';

const router = Router();

router.post('/image', auth(true), requireRoles('ADMIN', 'MODERATOR', 'VENDOR'), imageUpload.single('file'), asyncHandler(uploadImage));
router.post('/audio', auth(true), requireRoles('ADMIN', 'MODERATOR', 'VENDOR'), audioUpload.single('file'), asyncHandler(uploadAudio));
router.delete('/:id', auth(true), requireRoles('ADMIN', 'MODERATOR'), asyncHandler(removeMedia));

export default router;
