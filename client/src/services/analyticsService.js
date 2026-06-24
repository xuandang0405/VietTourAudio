import { apiClient } from './apiClient';

export const analyticsService = {
  trackQrScan: (payload) => apiClient.post('/analytics/qr-scan', payload),
  trackAudioPlay: (payload) => apiClient.post('/analytics/audio-play', payload),
  trackVisit: (payload) => apiClient.post('/analytics/visit', payload),
  getStallOwnerDashboard: () => apiClient.get('/analytics/stall-owner-dashboard')
};
