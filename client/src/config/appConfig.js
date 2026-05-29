export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
  mapProvider: import.meta.env.VITE_MAP_PROVIDER ?? 'leaflet',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE ?? 'vi'
};
