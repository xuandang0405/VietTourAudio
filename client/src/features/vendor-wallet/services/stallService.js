import { apiClient } from '../../../services/apiClient';

export const stallService = {
  getAll: () => apiClient.get('/stalls'),
  resolveCode: (code, lang) => apiClient.get(`/guest/resolve-code/${encodeURIComponent(code)}` + (lang ? `?lang=${lang}` : ''))
};
