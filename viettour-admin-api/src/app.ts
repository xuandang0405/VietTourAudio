import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Import routes
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

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Static files (uploaded media)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes — tất cả dưới /api/admin
const api = '/api/admin';
app.use(api, auditMiddleware);
app.use(`${api}/auth`,          authRoutes);
app.use(`${api}/vendors`,       vendorRoutes);
app.use(`${api}/wallets`,       walletRoutes);
app.use(`${api}/topup`,         topUpRoutes);
app.use(`${api}/content`,       contentRoutes);
app.use(`${api}/pois`,          poiRoutes);
app.use(`${api}/subscriptions`, subscriptionRoutes);
app.use(`${api}/revenue`,       revenueRoutes);
app.use(`${api}/analytics`,     analyticsRoutes);
app.use(`${api}/geofences`,     geofenceRoutes);
app.use(`${api}/audit-logs`,    auditRoutes);
app.use(`${api}/users`,         userRoutes);

app.use(errorMiddleware);
export default app;
