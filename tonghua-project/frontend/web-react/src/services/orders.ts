import api from './api';
import type { Order } from '@/types';

export interface CreateOrderRequest {
  items: { product_id: number; quantity: number }[];
  shipping_address?: string;
  payment_method?: 'wechat' | 'alipay' | 'stripe' | 'paypal';
}

export const ordersApi = {
  create: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await api.get('/orders/mine');
    return response.data.data;
  },

  cancel: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data.data;
  },
};
