import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import authRoutes from './routes/auth.routes';
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
import { errorMiddleware } from './middleware/error.middleware';
import { auditMiddleware } from './middleware/audit.middleware';

const app = express();
const api = '/api/admin';

const allowedOrigins = new Set(
  [
    'http://localhost:5174',
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
app.use(api, auditMiddleware);
app.use(`${api}/vendors`, vendorRoutes);
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

app.use(errorMiddleware);

export default app;
