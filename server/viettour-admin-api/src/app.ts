import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import authRoutes from './routes/auth.routes';
import vendorAuthRoutes from './routes/vendor-auth.routes';
import vendorPortalRoutes from './routes/vendor-portal.routes';
import vendorRoutes from './routes/vendor.routes';
import contentRoutes from './routes/content.routes';
import poiRoutes from './routes/poi.routes';
import subscriptionRoutes from './routes/subscription.routes';
import revenueRoutes from './routes/revenue.routes';
import analyticsRoutes from './routes/analytics.routes';
import geofenceRoutes from './routes/geofence.routes';
import auditRoutes from './routes/audit.routes';
import userRoutes from './routes/user.routes';
import walletRoutes from './routes/wallet.routes';
import topUpRoutes from './routes/topup.routes';
import stallRoutes from './routes/stall.routes';
import guestRoutes from './routes/guest.routes';
import paymentRoutes from './routes/payment.routes';
import zoneRoutes from './routes/zone.routes';
import translateRoutes from './routes/translate.routes';
import ticketRoutes from './routes/ticket.routes';
import narrationRoutes from './routes/narration.routes';
import notificationRoutes from './routes/notification.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { auditMiddleware } from './middleware/audit.middleware';

const app = express();
const api = '/api/admin';

const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    ...(process.env.FRONTEND_URL ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  ]
);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(`${api}/auth`, authRoutes);
app.use('/api/vendor/auth', vendorAuthRoutes);
app.use('/api/vendor', vendorPortalRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/payment', paymentRoutes);
app.use(api, auditMiddleware);
app.use(`${api}/vendors`, vendorRoutes);
app.use(`${api}/stalls`, stallRoutes);
app.use(`${api}/wallets`, walletRoutes);
app.use(`${api}/topup`, topUpRoutes);
app.use(`${api}/content`, contentRoutes);
app.use(`${api}/pois`, poiRoutes);
app.use(`${api}/subscriptions`, subscriptionRoutes);
app.use(`${api}/revenue`, revenueRoutes);
app.use(`${api}/analytics`, analyticsRoutes);
app.use(`${api}/geofences`, geofenceRoutes);
app.use(`${api}/audit-logs`, auditRoutes);
app.use(`${api}/users`, userRoutes);
app.use(`${api}/zones`, zoneRoutes);
app.use(`${api}/translate`, translateRoutes);
app.use(`${api}/tickets`, ticketRoutes);
app.use(`${api}/narrations`, narrationRoutes);
app.use(`${api}/notifications`, notificationRoutes);

app.use(errorMiddleware);

export default app;
