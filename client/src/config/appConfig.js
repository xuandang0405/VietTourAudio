const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api').trim();
const hasCustomPort = rawApiBaseUrl.includes(':', 8);

let isProdSsl = false;
let baseDomain = rawApiBaseUrl;

if (rawApiBaseUrl.startsWith('https://') && !hasCustomPort) {
  isProdSsl = true;
  baseDomain = rawApiBaseUrl.replace(/\/api\/?$/, '');
}

export const appConfig = {
  apiBaseUrl: isProdSsl ? `${baseDomain}/api` : rawApiBaseUrl,
  adminApiBaseUrl: isProdSsl ? `${baseDomain}/api` : (import.meta.env.VITE_ADMIN_API_BASE_URL ?? 'http://localhost:5001/api').trim(),
  vendorApiBaseUrl: isProdSsl ? `${baseDomain}/api/vendor` : (import.meta.env.VITE_VENDOR_API_BASE_URL ?? 'http://localhost:5001/api/vendor').trim(),
  vendorAuthApiBaseUrl: isProdSsl ? `${baseDomain}/api/vendor/auth` : (import.meta.env.VITE_VENDOR_AUTH_API_BASE_URL ?? 'http://localhost:5001/api/vendor/auth').trim(),
  guestApiBaseUrl: isProdSsl ? `${baseDomain}/api/guest` : (import.meta.env.VITE_GUEST_API_BASE_URL ?? 'http://localhost:5001/api/guest').trim(),
  paymentApiBaseUrl: isProdSsl ? `${baseDomain}/api/payment` : (import.meta.env.VITE_PAYMENT_API_BASE_URL ?? 'http://localhost:5001/api/payment').trim(),
  publicAppUrl: (import.meta.env.VITE_PUBLIC_APP_URL ?? window.location.origin).trim(),
  mapProvider: import.meta.env.VITE_MAP_PROVIDER ?? 'leaflet',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE ?? 'vi'
};

