import axios from 'axios';
import { appConfig } from '../../config/appConfig';
import { useAdminAuthStore } from '../store/adminAuthStore';

export const adminApiClient = axios.create({
  baseURL: appConfig.adminApiBaseUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let refreshPromise = null;

function unwrap(response) {
  return response.data?.data ?? response.data;
}

function getAuthUrl(path) {
  return `${appConfig.adminApiBaseUrl}${path}`;
}

async function refreshAccessToken() {
  const { refreshToken, user, setSession, clearSession } = useAdminAuthStore.getState();

  if (!refreshToken) {
    clearSession();
    return '';
  }

  refreshPromise =
    refreshPromise ??
    axios
      .post(getAuthUrl('/admin/auth/refresh'), { refreshToken })
      .then((response) => {
        const data = unwrap(response);
        setSession({
          user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        });
        return data.accessToken;
      })
      .catch((error) => {
        clearSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });

  return refreshPromise;
}

adminApiClient.interceptors.request.use(async (config) => {
  const isAuthRoute = String(config.url ?? '').includes('/auth/');
  const state = useAdminAuthStore.getState();
  let token = state.accessToken;

  if (!token && state.refreshToken && !isAuthRoute) {
    token = await refreshAccessToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry || String(originalRequest?.url ?? '').includes('/auth/')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const token = await refreshAccessToken();
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return adminApiClient(originalRequest);
  }
);

export async function adminLogin(credentials) {
  return unwrap(await adminApiClient.post('/admin/auth/login', credentials));
}

export async function fetchAdminNotifications() {
  return unwrap(await adminApiClient.get('/admin/notifications'));
}

export async function markAdminNotificationRead(id) {
  return unwrap(await adminApiClient.post(`/admin/notifications/${id}/read`));
}

export async function adminLogout() {
  const { refreshToken } = useAdminAuthStore.getState();
  return unwrap(await adminApiClient.post('/admin/auth/logout', { refreshToken }));
}

export async function fetchAdminMe() {
  return unwrap(await adminApiClient.get('/admin/auth/me'));
}

export async function fetchVendors(params = {}) {
  return unwrap(await adminApiClient.get('/admin/vendors', { params }));
}

export async function fetchVendor(id) {
  return unwrap(await adminApiClient.get(`/admin/vendors/${id}`));
}

export async function updateVendor(id, vendorData) {
  return unwrap(await adminApiClient.put(`/admin/vendors/${id}`, vendorData));
}

export async function approveVendor(id) {
  return unwrap(await adminApiClient.post(`/admin/vendors/${id}/approve`));
}

export async function rejectVendor(id, reason) {
  return unwrap(await adminApiClient.post(`/admin/vendors/${id}/reject`, { reason }));
}

export async function suspendVendor(id, reason) {
  return unwrap(await adminApiClient.post(`/admin/vendors/${id}/suspend`, { reason }));
}

export async function forceCancelVendor(id, reason) {
  return unwrap(await adminApiClient.post(`/admin/vendors/${id}/force-cancel`, { reason }));
}

export async function updateVendorStatus(id, status, reason) {
  return unwrap(await adminApiClient.put(`/admin/vendors/${id}/status`, { status, reason }));
}

export async function fetchVendorWallets() {
  return unwrap(await adminApiClient.get('/admin/wallets'));
}

export async function fetchVendorWallet(vendorId) {
  return unwrap(await adminApiClient.get(`/admin/wallets/${vendorId}`));
}

export async function creditVendorWallet(vendorId, payload) {
  return unwrap(await adminApiClient.post(`/admin/wallets/${vendorId}/credit`, payload));
}

export async function debitVendorWallet(vendorId, payload) {
  return unwrap(await adminApiClient.post(`/admin/wallets/${vendorId}/debit`, payload));
}

export async function fetchTopUpRequests(params = {}) {
  return unwrap(await adminApiClient.get('/admin/topup/requests', { params }));
}

export async function approveTopUpRequest(id) {
  return unwrap(await adminApiClient.post(`/admin/topup/requests/${id}/approve`));
}

export async function rejectTopUpRequest(id, reason) {
  return unwrap(await adminApiClient.post(`/admin/topup/requests/${id}/reject`, { reason }));
}

export async function fetchRevenueOverview(params = {}) {
  return unwrap(await adminApiClient.get('/admin/revenue/overview', { params }));
}

export async function fetchRevenueTimeline(params = {}) {
  return unwrap(await adminApiClient.get('/admin/revenue/timeline', { params }));
}

export async function fetchPaymentRevenueStats() {
  return unwrap(await adminApiClient.get('/admin/revenue/payment-stats'));
}

export async function exportRevenueCsv(params = {}) {
  const response = await adminApiClient.get('/admin/revenue/export', {
    params,
    responseType: 'blob'
  });
  return response.data;
}

export async function fetchContentQueue(params = {}) {
  return unwrap(await adminApiClient.get('/admin/content/queue', { params }));
}

export async function approveContent(id) {
  return unwrap(await adminApiClient.post(`/admin/content/${id}/approve`));
}

export async function rejectContent(id, reason) {
  return unwrap(await adminApiClient.post(`/admin/content/${id}/reject`, { reason }));
}

export async function hideContent(id, reason) {
  return unwrap(await adminApiClient.post(`/admin/content/${id}/hide`, { reason }));
}

export async function bulkApproveContent(ids) {
  return unwrap(await adminApiClient.patch('/admin/content/bulk-approve', { ids }));
}

export async function fetchGeofences() {
  return unwrap(await adminApiClient.get('/admin/geofences/all'));
}

export async function checkGeofenceOverlap(payload) {
  return unwrap(await adminApiClient.post('/admin/geofences/check-overlap', payload));
}

export async function fetchAdminPois() {
  return unwrap(await adminApiClient.get('/admin/pois'));
}

export async function fetchPoiDistance(poi1Id, poi2Id) {
  return unwrap(
    await adminApiClient.get('/admin/pois/distance', {
      params: {
        poi1_id: poi1Id,
        poi2_id: poi2Id
      }
    })
  );
}

export async function fetchStallsList() {
  return unwrap(await adminApiClient.get('/admin/pois/stalls'));
}

export async function fetchZonesList() {
  return unwrap(await adminApiClient.get('/admin/pois/zones'));
}

export async function createAdminPoi(poiData) {
  return unwrap(await adminApiClient.post('/admin/pois', poiData));
}

export async function updateAdminPoi(id, poiData) {
  return unwrap(await adminApiClient.put(`/admin/pois/${id}`, poiData));
}

export async function deleteAdminPoi(arg) {
  const id = typeof arg === 'object' ? arg.id : arg;
  const reason = typeof arg === 'object' ? arg.reason : undefined;
  return unwrap(await adminApiClient.delete(`/admin/pois/${id}`, { params: reason ? { reason } : undefined }));
}

export async function fetchAdminApprovals() {
  return unwrap(await adminApiClient.get('/admin/stalls/pending'));
}

export async function approveAdminPoi(id) {
  return unwrap(await adminApiClient.post(`/admin/stalls/${id}/approve`));
}

export async function rejectAdminPoi(id) {
  return unwrap(await adminApiClient.post(`/admin/stalls/${id}/reject`));
}

export async function fetchGeofenceAllData() {
  return unwrap(await adminApiClient.get('/admin/geofences/all-data'));
}

export async function fetchAuditLogs() {
  return unwrap(await adminApiClient.get('/admin/audit-logs'));
}

export async function fetchToursList() {
  return unwrap(await adminApiClient.get('/admin/vendors/tours-list'));
}

export async function createVendorAccount(vendorData) {
  return unwrap(await adminApiClient.post('/admin/vendors', vendorData));
}

export async function createZoneAdminAccount(adminData) {
  return unwrap(await adminApiClient.post('/admin/users/zone-admins', adminData));
}

export async function resetStallQr(id) {
  return unwrap(await adminApiClient.put(`/admin/stalls/${id}/qr/reset`));
}

export async function fetchHourlyActiveUsers() {
  return unwrap(await adminApiClient.get('/admin/analytics/hourly-active-users'));
}

export async function fetchDashboardAnalytics() {
  return unwrap(await adminApiClient.get('/admin/analytics/dashboard'));
}

export async function fetchTours() {
  return unwrap(await adminApiClient.get('/admin/zones'));
}

export async function fetchTourById(id) {
  return unwrap(await adminApiClient.get(`/admin/zones/${id}`));
}

export async function createTour(tourData) {
  let body = tourData;
  let headers = undefined;
  if (!(tourData instanceof FormData)) {
    body = new FormData();
    for (const key in tourData) {
      if (tourData[key] !== undefined && tourData[key] !== null) {
        body.append(key, String(tourData[key]));
      }
    }
  }
  headers = { 'Content-Type': 'multipart/form-data' };
  return unwrap(await adminApiClient.post('/admin/zones', body, { headers }));
}

export async function updateTour(id, tourData) {
  let body = tourData;
  let headers = undefined;
  if (!(tourData instanceof FormData)) {
    body = new FormData();
    for (const key in tourData) {
      if (tourData[key] !== undefined && tourData[key] !== null) {
        body.append(key, String(tourData[key]));
      }
    }
  }
  headers = { 'Content-Type': 'multipart/form-data' };
  return unwrap(await adminApiClient.put(`/admin/zones/${id}`, body, { headers }));
}

export async function deleteTour(arg) {
  const id = typeof arg === 'object' ? arg.id : arg;
  const reason = typeof arg === 'object' ? arg.reason : undefined;
  return unwrap(await adminApiClient.delete(`/admin/zones/${id}`, { params: reason ? { reason } : undefined }));
}

export async function archiveTour(id) {
  return unwrap(await adminApiClient.patch(`/admin/zones/${id}/archive`));
}

export async function resetTourQr(id) {
  return unwrap(await adminApiClient.post(`/admin/pois/tours/${id}/qr/reset`));
}

export async function autoTranslate(text, targetLangs) {
  return unwrap(await adminApiClient.post('/admin/translate', { text, targetLangs }));
}

export async function unsuspendVendor(id) {
  return unwrap(await adminApiClient.post(`/admin/vendors/${id}/unsuspend`));
}

export async function fetchTickets() {
  return unwrap(await adminApiClient.get('/admin/tickets'));
}

export async function resolveTicket(id) {
  return unwrap(await adminApiClient.post(`/admin/tickets/${id}/resolve`));
}


export async function toggleStallPremium(stallId, isPremium) {
  return unwrap(await adminApiClient.put(`/admin/stalls/${stallId}/premium`, { isPremium }));
}

export async function grantMultiPremium(vendorId) {
  return unwrap(await adminApiClient.post('/admin/stalls/grant-multi-premium', { vendorId }));
}

export async function setPremiumPriority(stallId, vendorId) {
  return unwrap(await adminApiClient.put(`/admin/stalls/${stallId}/premium-priority`, { vendorId }));
}

export async function adminCreateStallForVendor(vendorId, data) {
  return unwrap(await adminApiClient.post('/admin/stalls/create-for-vendor', { vendorId, ...data }));
}

export async function fetchAdminUsers() {
  return unwrap(await adminApiClient.get('/admin/users'));
}

export async function fetchCommissions() {
  return unwrap(await adminApiClient.get('/admin/revenue/commissions'));
}

// Force Vite HMR reload to pick up the port 45200 configuration from appConfig.js
