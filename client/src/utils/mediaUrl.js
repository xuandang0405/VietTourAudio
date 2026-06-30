const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

export const mediaServerBaseUrl = apiBaseUrl.replace(/\/api$/i, '');

export function resolveBackendMediaUrl(path) {
  if (!path) return '';
  const value = String(path).trim();
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  const normalizedPath = value.startsWith('/')
    ? value
    : `/uploads/${value.replace(/^uploads\//i, '')}`;

  return `${mediaServerBaseUrl}${normalizedPath}`;
}
