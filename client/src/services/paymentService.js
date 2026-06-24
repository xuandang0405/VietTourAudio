import { apiClient } from './apiClient';

export const paymentService = {
  createPayment: (payload) => apiClient.post('/payments', payload),
  recordManualCash: (payload) => apiClient.post('/payments/manual-cash', payload),
  getPremiumQr: () => apiClient.get('/payment/premium-qr')
};
