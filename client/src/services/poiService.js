import { apiClient } from './apiClient';

export const poiService = {
  getAll: () => apiClient.get('/poi'),
  getNearby: (params) => apiClient.get('/poi/nearby', { params }),
  getById: (id) => apiClient.get(`/poi/${id}`)
};
