import { create } from 'zustand';
import { api } from '../api/client';

export const usePaymentStore = create((set) => ({
  payment: null,
  premiumActive: false,
  loading: false,
  createMockPayment: async (payload) => {
    set({ loading: true });
    const { data } = await api.post('/payments/mock/create', payload);
    set({ payment: data, loading: false });
    return data;
  },
  markMockPaid: async (id) => {
    set({ loading: true });
    const { data } = await api.post(`/payments/mock/${id}/pay`);
    set({ payment: data, premiumActive: data.status === 'PAID', loading: false });
    return data;
  },
  checkStatus: async (id) => {
    const { data } = await api.get(`/payments/${id}/status`);
    set({ payment: data, premiumActive: data.status === 'PAID' });
    return data;
  },
  setPremiumActive: (premiumActive) => set({ premiumActive })
}));
