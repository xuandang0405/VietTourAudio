import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

function toPublicUrl(filePath) {
  const relative = filePath.replace(path.resolve(env.uploadDir), '').replace(/\\/g, '/');
  return `${env.publicBaseUrl}/uploads${relative}`;
}

export async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const item = await prisma.mediaFile.create({
    data: {
      ownerUserId: req.user.id,
      shopId: req.user.shopId,
      mediaType: 'image',
      storagePath: req.file.path,
      publicUrl: toPublicUrl(req.file.path),
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size
    }
  });
  return res.status(201).json(item);
}

export async function uploadAudio(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const item = await prisma.mediaFile.create({
    data: {
      ownerUserId: req.user.id,
      shopId: req.user.shopId,
      mediaType: 'audio',
      storagePath: req.file.path,
      publicUrl: toPublicUrl(req.file.path),
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size
    }
  });
  return res.status(201).json(item);
}

export async function removeMedia(req, res) {
  const id = Number(req.params.id);
  const item = await prisma.mediaFile.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ error: 'Media not found' });

  await prisma.mediaFile.delete({ where: { id } });
  try {
    await fs.unlink(item.storagePath);
  } catch {
    // file may already be removed
  }

  return res.json({ success: true });
}
