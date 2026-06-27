import axios from 'axios';
import { appConfig } from '../../config/appConfig';
import { useVendorAuthStore } from '../store/vendorAuthStore';

export const vendorApiClient = axios.create({
  baseURL: appConfig.vendorApiBaseUrl,
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
  return `${appConfig.vendorAuthApiBaseUrl}${path}`;
}

async function refreshAccessToken() {
  const { refreshToken, user, setSession, clearSession } = useVendorAuthStore.getState();

  if (!refreshToken) {
    clearSession();
    return '';
  }

  refreshPromise =
    refreshPromise ??
    axios
      .post(getAuthUrl('/refresh'), { refreshToken })
      .then((response) => {
        const data = unwrap(response);
        setSession({
          user: data.user ?? user,
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

vendorApiClient.interceptors.request.use(async (config) => {
  const state = useVendorAuthStore.getState();
  let token = state.accessToken;

  if (!token && state.refreshToken) {
    token = await refreshAccessToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

vendorApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403) {
      useVendorAuthStore.getState().clearSession();
      window.location.href = '/vendor/login';
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const token = await refreshAccessToken();
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return vendorApiClient(originalRequest);
  }
);

// --- Auth ---

export async function vendorLogin(credentials) {
  // Support both vendor_code and email login
  const payload = credentials.vendorCode
    ? { vendorCode: credentials.vendorCode, password: credentials.password }
    : { email: credentials.email, password: credentials.password };

  return unwrap(await axios.post(getAuthUrl('/login'), payload));
}

export async function vendorLogout() {
  const { accessToken, refreshToken } = useVendorAuthStore.getState();
  return unwrap(
    await axios.post(
      getAuthUrl('/logout'),
      { refreshToken },
      {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
      }
    )
  );
}

export async function fetchVendorMe() {
  const { accessToken } = useVendorAuthStore.getState();
  return unwrap(
    await axios.get(getAuthUrl('/me'), {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    })
  );
}

// --- Dashboard ---

export async function fetchVendorDashboard() {
  return unwrap(await vendorApiClient.get('/dashboard'));
}

// --- POIs ---

export async function fetchVendorPois() {
  return unwrap(await vendorApiClient.get('/pois'));
}

export async function updateVendorPoi(poiId, data) {
  return unwrap(await vendorApiClient.put(`/pois/${poiId}`, data));
}

// --- Revenue ---

export async function fetchVendorRevenue() {
  return unwrap(await vendorApiClient.get('/revenue'));
}

// --- Stall Management ---

export async function fetchVendorStall() {
  return unwrap(await vendorApiClient.get('/stall'));
}

export async function updateStallLocation(latitude, longitude) {
  return unwrap(await vendorApiClient.put('/location', { latitude, longitude }));
}

export async function updateStallInfo(data) {
  return unwrap(await vendorApiClient.put('/stall', data));
}

// --- Content & TTS ---

export async function fetchVendorContent() {
  return unwrap(await vendorApiClient.get('/content'));
}

export async function submitVendorContent(ttsScript, language = 'vi') {
  return unwrap(await vendorApiClient.post('/content', { ttsScript, language }));
}

// --- Subscription ---

export async function mockPaySubscription() {
  return unwrap(await vendorApiClient.post('/pay-subscription'));
}

// --- Stall QR ---

export async function fetchVendorStallQr() {
  return unwrap(await vendorApiClient.get('/stall/qr'));
}