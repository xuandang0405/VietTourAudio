import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';

const imageExt = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const imageMime = new Set(['image/jpeg', 'image/png', 'image/webp']);
const audioExt = new Set(['.mp3', '.wav', '.mpeg']);
const audioMime = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav']);

function safeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
}

function createStorage(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.resolve(env.uploadDir, folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${safeName(path.basename(file.originalname, ext))}${ext}`);
    }
  });
}

function createFilter(extSet, mimeSet) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!extSet.has(ext) || !mimeSet.has(file.mimetype)) {
      cb(new Error('Invalid file type'));
      return;
    }
    cb(null, true);
  };
}

export const imageUpload = multer({
  storage: createStorage('images'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: createFilter(imageExt, imageMime)
});

export const audioUpload = multer({
  storage: createStorage('audio'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: createFilter(audioExt, audioMime)
});
