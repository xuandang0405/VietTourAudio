import { api } from './client';

async function safeCall(fn, fallback) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function fetchDashboard() {
  return safeCall(async () => {
    const [dashboard, activity] = await Promise.all([
      api.get('/analytics/dashboard').then((r) => r.data),
      api.get('/analytics/activity').then((r) => r.data)
    ]);
    return { dashboard, activity: activity.items || [] };
  }, { dashboard: null, activity: [] });
}

export async function fetchHeatmap() {
  return safeCall(() => api.get('/analytics/heatmap').then((r) => r.data), { points: [] });
}

export async function fetchZones() {
  return safeCall(() => api.get('/zones').then((r) => r.data.items || []), []);
}

export async function createZone(payload) {
  const { data } = await api.post('/zones', payload);
  return data;
}

export async function fetchTours() {
  return safeCall(() => api.get('/tours').then((r) => r.data.items || []), []);
}

export async function fetchUsers() {
  return safeCall(() => api.get('/users').then((r) => r.data.items || []), []);
}

export async function fetchPayments() {
  return safeCall(() => api.get('/payments/admin/list').then((r) => r.data.items || []), []);
}

export async function fetchQrList() {
  return safeCall(() => api.get('/qr').then((r) => r.data.items || []), []);
}

export async function createQr(payload) {
  const { data } = await api.post('/qr', payload);
  return data;
}

export async function fetchPendingNarrations() {
  return safeCall(() => api.get('/narrations/pending').then((r) => r.data.items || []), []);
}

export async function approveNarration(id) {
  const { data } = await api.post(`/narrations/${id}/approve`);
  return data;
}

export async function rejectNarration(id, reason) {
  const { data } = await api.post(`/narrations/${id}/reject`, { reason });
  return data;
}

export async function fetchSettings() {
  return safeCall(() => api.get('/settings').then((r) => r.data.items || []), []);
}

export async function upsertSetting(key, value) {
  const { data } = await api.post('/settings', { key, value });
  return data;
}
