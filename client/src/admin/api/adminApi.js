import axios from 'axios';
import { appConfig } from '../../config/appConfig';
import { useAdminAuthStore } from '../store/adminAuthStore';

export const adminApiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
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
  return `${appConfig.apiBaseUrl}${path}`;
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
