import { apiClient } from './apiClient';

export const uploadService = {
  uploadImage: (formData) => apiClient.post('/upload/image', formData),
  uploadVideo: (formData) => apiClient.post('/upload/video', formData),
  uploadAudio: (formData) => apiClient.post('/upload/audio', formData)
};
