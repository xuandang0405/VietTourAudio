export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
  adminApiBaseUrl: import.meta.env.VITE_ADMIN_API_BASE_URL ?? 'http://localhost:5001/api',
  publicAppUrl: import.meta.env.VITE_PUBLIC_APP_URL ?? window.location.origin,
  mapProvider: import.meta.env.VITE_MAP_PROVIDER ?? 'leaflet',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE ?? 'vi'
};
