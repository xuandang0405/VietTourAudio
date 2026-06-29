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
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
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
  return unwrap(await axios.post(getAuthUrl('/login'), {
    email: credentials.email,
    password: credentials.password
  }));
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

export async function requestUpdatePoi(data) {
  return unwrap(await vendorApiClient.put('/poi/request-update', data));
}

// --- Revenue ---

export async function fetchVendorRevenue() {
  return unwrap(await vendorApiClient.get('/revenue'));
}

export async function requestPremiumUpgrade(payload) {
  return unwrap(await vendorApiClient.post('/premium/request', payload));
}

// --- Stall Management ---

export async function fetchVendorStall() {
  return unwrap(await vendorApiClient.get('/my-stalls'));
}

export async function createVendorStall(data) {
  return unwrap(await vendorApiClient.post('/stalls', data));
}

export async function fetchVendorMyStalls() {
  return unwrap(await vendorApiClient.get('/my-stalls'));
}

export async function updateStallLocation(latitude, longitude) {
  return unwrap(await vendorApiClient.put('/location', { latitude, longitude }));
}

export async function updateStallInfo(data) {
  return unwrap(await vendorApiClient.put('/stall', data));
}

export async function submitVendorStallUpdate(formData) {
  return unwrap(await vendorApiClient.put('/stall/submit', formData));
}

// --- Content & TTS ---

export async function fetchVendorContent() {
  return unwrap(await vendorApiClient.get('/content'));
}

export async function submitVendorContent(ttsScript, language = 'vi') {
  return unwrap(await vendorApiClient.post('/content', { ttsScript, language }));
}

export const submitContent = submitVendorContent;

// --- Subscription ---

export async function paySubscriptionFromWallet() {
  return unwrap(await vendorApiClient.post('/pay-subscription'));
}

export async function submitWalletTopUp(formData) {
  return unwrap(await vendorApiClient.post('/topups', formData));
}

// --- Stall QR ---

export async function fetchVendorStallQr() {
  return unwrap(await vendorApiClient.get('/stall/qr'));
}

// --- Product Catalog ---

export async function fetchPoiProducts(poiId) {
  return unwrap(await vendorApiClient.get(`/pois/${poiId}/products`));
}

export async function createPoiProduct(poiId, data) {
  return unwrap(await vendorApiClient.post(`/pois/${poiId}/products`, data));
}

export async function updatePoiProduct(poiId, productId, data) {
  return unwrap(await vendorApiClient.put(`/pois/${poiId}/products/${productId}`, data));
}

export async function deletePoiProduct(poiId, productId) {
  return unwrap(await vendorApiClient.delete(`/pois/${poiId}/products/${productId}`));
}
