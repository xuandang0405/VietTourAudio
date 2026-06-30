import axios from 'axios';
import { apiClient } from '../../../services/apiClient';
import { appConfig } from '../../../config/appConfig';

export const stallService = {
  getAll: () => apiClient.get('/stalls'),
  resolveCode: (code, lang) => axios.get(`${appConfig.guestApiBaseUrl}/resolve-code/${encodeURIComponent(code)}` + (lang ? `?lang=${lang}` : ''))
};
