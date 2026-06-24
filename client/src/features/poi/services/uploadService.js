import { apiClient } from '../../../services/apiClient';

export const uploadService = {
  uploadImage: (formData) => apiClient.post('/media/upload', withFileType(formData, 'IMAGE')),
  uploadVideo: (formData) => apiClient.post('/media/upload', withFileType(formData, 'VIDEO')),
  uploadAudio: (formData) => apiClient.post('/media/upload', withFileType(formData, 'AUDIO'))
};

function withFileType(formData, fileType) {
  if (!formData.has('fileType')) formData.append('fileType', fileType);
  return formData;
}
