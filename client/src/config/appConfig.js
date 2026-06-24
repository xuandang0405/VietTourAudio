export const appConfig = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api').trim(),
  adminApiBaseUrl: (import.meta.env.VITE_ADMIN_API_BASE_URL ?? 'http://localhost:5001/api').trim(),
  vendorApiBaseUrl: (import.meta.env.VITE_VENDOR_API_BASE_URL ?? 'http://localhost:5001/api/vendor').trim(),
  vendorAuthApiBaseUrl: (import.meta.env.VITE_VENDOR_AUTH_API_BASE_URL ?? 'http://localhost:5001/api/vendor/auth').trim(),
  guestApiBaseUrl: (import.meta.env.VITE_GUEST_API_BASE_URL ?? 'http://localhost:5001/api/guest').trim(),
  paymentApiBaseUrl: (import.meta.env.VITE_PAYMENT_API_BASE_URL ?? 'http://localhost:5001/api/payment').trim(),
  publicAppUrl: (import.meta.env.VITE_PUBLIC_APP_URL ?? window.location.origin).trim(),
  mapProvider: import.meta.env.VITE_MAP_PROVIDER ?? 'leaflet',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE ?? 'vi'
};
