import axios from 'axios';
import { appConfig } from '../config/appConfig';
import { useAdminAuthStore } from '../admin/store/adminAuthStore';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || appConfig.adminApiBaseUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosClient.interceptors.request.use(
  (config) => {
    // Find the token from Zustand store or localStorage
    const adminToken = useAdminAuthStore.getState().accessToken;
    const token = adminToken || localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
