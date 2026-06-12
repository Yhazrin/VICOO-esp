import api from './api';

export interface UploadedImage {
  url: string;
  mime: string;
  size_bytes: number;
}

export async function uploadUserImage(file: File): Promise<UploadedImage> {
  const form = new FormData();
  form.append('file', file);
  const { data: envelope } = await api.post('/uploads/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return envelope.data as UploadedImage;
}
