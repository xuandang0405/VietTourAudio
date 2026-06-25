import axios from 'axios';
import { useAppStore } from '../stores/useAppStore';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const state = useAppStore.getState();
  if (state.guestId) config.headers['x-guest-id'] = state.guestId;
  if (state.sessionId) config.headers['x-session-id'] = state.sessionId;
  config.headers['Accept-Language'] = state.language || 'vi';
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err?.response?.data?.error || err.message || 'Unknown error';
    return Promise.reject(new Error(message));
  }
);

export function toAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const root = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return root ? `${root}${path.startsWith('/') ? '' : '/'}${path}` : path;
}
