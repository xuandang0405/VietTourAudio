import { apiClient } from '../../services/apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const apiTruyCapPremium = {
  getStatus: (poiId) =>
    apiClient.get('/user/premium-status', {
      params: poiId ? { poiId: String(poiId) } : undefined
    }).then(unwrap),
  authorizeAudioPlay: (poiId) =>
    apiClient.post('/user/audio-access', { poiId: String(poiId) }).then(unwrap),
  unlock24Hours: () => apiClient.post('/user/unlock-24h').then(unwrap)
};
