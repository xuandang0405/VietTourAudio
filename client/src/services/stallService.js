import { apiClient } from './apiClient';

export const stallService = {
  getAll: () => apiClient.get('/stalls')
};
