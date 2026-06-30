import { apiClient } from '../../../services/apiClient';
import { appConfig } from '../../../config/appConfig';

export const poiService = {
  getAll: () => apiClient.get('/pois'),
  getNearby: (params) => apiClient.get('/pois/nearby', { params }),
  getById: (id) => apiClient.get(`/pois/${id}`),
  getContents: (id) => apiClient.get(`/poi-contents/poi/${id}`),
  getGuestPois: (zoneCode, lang) => apiClient.get('/guest/pois', {
    params: { zone_code: zoneCode, lang }
  }),
  resolveGuestZone: (zoneToken, lang) => apiClient.get(
    `/guest/resolve-code/${encodeURIComponent(zoneToken)}?lang=${encodeURIComponent(lang)}`
  )
};
