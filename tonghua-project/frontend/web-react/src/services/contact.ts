import api from './api';
import type { ContactFormRequest } from '@/types';

export const contactApi = {
  submit: async (data: ContactFormRequest): Promise<{ id: number; message: string }> => {
    const response = await api.post('/contact', data);
    return response.data.data;
  },
};
