import api from './api';

export async function uploadImage(base64Image: string, folder?: string) {
  const response = await api.post('/api/upload', { image: base64Image, folder });
  return response.data as { url: string; publicId: string };
}
