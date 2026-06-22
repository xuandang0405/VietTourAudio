import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env: ${key}`);
  }
}

if (process.env.NODE_ENV === 'production' && (process.env.JWT_SECRET?.length ?? 0) < 32) {
  throw new Error('JWT_SECRET must be at least 32 chars in production');
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3001',
  frontendOrigins: (process.env.FRONTEND_ORIGINS ?? '').split(',').map((x) => x.trim()).filter(Boolean),
  googleTtsKey: process.env.GOOGLE_TTS_KEY ?? '',
  googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',
  qrPublicBaseUrl: process.env.QR_PUBLIC_BASE_URL ?? 'http://localhost:5173/scan',
  rootDir: process.cwd(),
  resolveUploadPath: (...parts) => path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? './uploads', ...parts)
};
