import { apiClient } from './apiClient';

export const authService = {
  login: (payload) => apiClient.post('/auth/login', payload),
  register: (payload) => apiClient.post('/auth/register', payload),
  getProfile: () => apiClient.get('/auth/me')
};
