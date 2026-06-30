const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api')
  .trim()
  .replace(/\/+$/, '');
const apiOrigin = rawApiBaseUrl.replace(/\/api$/i, '');

export const appConfig = {
  apiOrigin,
  apiBaseUrl: rawApiBaseUrl,
  adminApiBaseUrl: rawApiBaseUrl,
  vendorApiBaseUrl: `${rawApiBaseUrl}/vendor`,
  vendorAuthApiBaseUrl: `${rawApiBaseUrl}/vendor/auth`,
  guestApiBaseUrl: `${rawApiBaseUrl}/guest`,
  paymentApiBaseUrl: `${rawApiBaseUrl}/payment`,
  publicAppUrl: (import.meta.env.VITE_PUBLIC_APP_URL ?? window.location.origin).trim(),
  appRole: (import.meta.env.VITE_APP_ROLE ?? 'mobile').trim().toLowerCase(),
  appEntryPath: (import.meta.env.VITE_APP_ENTRY_PATH ?? '/').trim(),
  mapProvider: import.meta.env.VITE_MAP_PROVIDER ?? 'leaflet',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE ?? 'vi'
};
