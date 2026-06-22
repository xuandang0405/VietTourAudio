import { api } from '../api/client';
import { queueAnalytics } from './idb';

export async function trackAnalytics(event) {
  try {
    await api.post('/analytics/track', event);
  } catch {
    await queueAnalytics({ ...event, createdAt: Date.now() });
  }
}
