import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import zonesRoutes from './routes/zones.routes.js';
import toursRoutes from './routes/tours.routes.js';
import narrationsRoutes from './routes/narrations.routes.js';
import qrRoutes from './routes/qr.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';
import usersRoutes from './routes/users.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import uploadsRoutes from './routes/uploads.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import geofenceRoutes from './routes/geofence.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp(io) {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: env.frontendOrigins,
    credentials: true
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(morgan('dev'));

  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

  app.use('/uploads', express.static(path.resolve(env.uploadDir)));

  app.use('/api/auth', authRoutes);
  app.use('/api/zones', zonesRoutes);
  app.use('/api/tours', toursRoutes);
  app.use('/api/tour', toursRoutes);
  app.use('/api/narrations', narrationsRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/vendor', vendorRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/uploads', uploadsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/geofence', geofenceRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
