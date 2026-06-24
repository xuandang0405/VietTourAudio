import { api } from '../api/client';
import { clearPendingOps, getPendingOps, clearQueuedAnalytics, getQueuedAnalytics } from './idb';

export async function flush() {
  const pending = await getPendingOps();
  const analytics = await getQueuedAnalytics();

  const favoriteOpsByGuest = pending.reduce((acc, op) => {
    if (!acc[op.guestId]) acc[op.guestId] = [];
    acc[op.guestId].push({ zoneId: op.zoneId, action: op.action });
    return acc;
  }, {});

  const okIds = [];
  for (const op of pending) {
    try {
      await api.post('/favorites/sync', {
        guestId: op.guestId,
        ops: favoriteOpsByGuest[op.guestId] || [{ zoneId: op.zoneId, action: op.action }]
      });
      okIds.push(op.id);
    } catch {
      // keep for next retry
    }
  }
  if (okIds.length) await clearPendingOps(okIds);

  const analyticsOkIds = [];
  for (const a of analytics) {
    try {
      await api.post('/analytics/track', a);
      analyticsOkIds.push(a.id);
    } catch {
      // keep
    }
  }
  if (analyticsOkIds.length) await clearQueuedAnalytics(analyticsOkIds);
}
