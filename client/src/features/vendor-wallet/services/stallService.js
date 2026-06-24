import { apiClient } from '../../../services/apiClient';

export const stallService = {
  getAll: () => apiClient.get('/stalls'),
  resolveCode: (code) => apiClient.get('/guest/resolve-code/' + code)
};
