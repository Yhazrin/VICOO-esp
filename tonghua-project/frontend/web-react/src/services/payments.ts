import api from './api';
import type { Payment } from '@/types';

export interface CreatePaymentRequest {
  order_id?: number;
  donation_id?: number;
  amount: number;
  method: 'wechat' | 'alipay' | 'stripe' | 'paypal';
}

export const paymentsApi = {
  create: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await api.post<{ success: boolean; data: Payment }>(
      '/payments/create',
      data,
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<Payment> => {
    const response = await api.get<{ success: boolean; data: Payment }>(
      `/payments/${id}`,
    );
    return response.data.data;
  },
};
