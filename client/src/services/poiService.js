import { apiClient } from './apiClient';

export const poiService = {
  getAll: () => apiClient.get('/pois'),
  getNearby: (params) => apiClient.get('/pois/nearby', { params }),
  getById: (id) => apiClient.get(`/pois/${id}`),
  getContents: (id) => apiClient.get(`/poi-contents/poi/${id}`)
};
