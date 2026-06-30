import axios from 'axios';

const baseURL = import.meta.env.VITE_ADMIN_API_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 12000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(error?.response?.data?.error || error.message || 'Request failed'))
);
