import { apiClient } from './apiClient';

export const paymentService = {
  createPayment: (payload) => apiClient.post('/payment/create', payload),
  recordManualCash: (payload) => apiClient.post('/payment/manual-cash', payload)
};
