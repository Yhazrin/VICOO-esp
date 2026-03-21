import api from './api';

export interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const contactApi = {
  submit: async (data: ContactFormRequest): Promise<{ id: number; message: string }> => {
    const response = await api.post('/contact', data);
    return response.data.data;
  },
};
