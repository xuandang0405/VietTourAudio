const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL.trim();
const hasCustomPort = rawApiBaseUrl.includes(':', 8);

let isProdSsl = false;
let baseDomain = rawApiBaseUrl;

if (rawApiBaseUrl.startsWith('https://') && !hasCustomPort) {
  isProdSsl = true;
  baseDomain = rawApiBaseUrl.replace(/\/api\/?$/, '');
}

export const appConfig = {
  apiBaseUrl: isProdSsl ? `${baseDomain}/api` : rawApiBaseUrl,
  adminApiBaseUrl: isProdSsl ? `${baseDomain}/api` : rawApiBaseUrl,
  vendorApiBaseUrl: isProdSsl ? `${baseDomain}/api/vendor` : `${rawApiBaseUrl}/vendor`,
  vendorAuthApiBaseUrl: isProdSsl ? `${baseDomain}/api/vendor/auth` : `${rawApiBaseUrl}/vendor/auth`,
  guestApiBaseUrl: isProdSsl ? `${baseDomain}/api/guest` : `${rawApiBaseUrl}/guest`,
  paymentApiBaseUrl: isProdSsl ? `${baseDomain}/api/payment` : `${rawApiBaseUrl}/payment`,
  publicAppUrl: (import.meta.env.VITE_PUBLIC_APP_URL ?? window.location.origin).trim(),
  mapProvider: import.meta.env.VITE_MAP_PROVIDER ?? 'leaflet',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE ?? 'vi'
};
