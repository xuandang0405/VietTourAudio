import axios from 'axios';
import { appConfig } from '../../config/appConfig';
import { useVendorAuthStore } from '../../vendor/store/vendorAuthStore';
import { adminApiClient } from '../../admin/api/adminApi';
import { getVisitorSessionId } from '../../utils/visitorSession';

const paymentClient = axios.create({
  baseURL: `${appConfig.apiBaseUrl}/payment/checkout`,
  timeout: 20000
});

paymentClient.interceptors.request.use((config) => {
  const token = useVendorAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Visitor-Session'] = getVisitorSessionId();
  return config;
});

const unwrap = (response) => response.data?.data ?? response.data;

export const paymentApi = {
  getPublicGateways: () => axios.get(`${appConfig.apiBaseUrl}/guest/payment-gateways`).then(unwrap),
  initialize: (intent) => paymentClient.post('/initialize', intent).then(unwrap),
  processVisa: (payload) => paymentClient.post('/visa-process', payload).then(unwrap),
  uploadProof: (transactionId, proof) => {
    const body = new FormData();
    body.append('transactionId', String(transactionId));
    body.append('proofFile', proof);
    return paymentClient.post('/upload-proof', body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(unwrap);
  },
  getStatus: (transactionId) =>
    axios.get(`${appConfig.apiBaseUrl}/payment/status/${transactionId}`).then(unwrap),
  getConfigs: () => adminApiClient.get('/admin/payment-config').then(unwrap),
  updateConfig: (body) => adminApiClient.post('/admin/payment-config/update', body, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(unwrap),
  getPending: () => adminApiClient.get('/admin/transactions/pending').then(unwrap),
  verify: (id, status) => adminApiClient.post(`/admin/transactions/${id}/verify`, { status }).then(unwrap)
};
