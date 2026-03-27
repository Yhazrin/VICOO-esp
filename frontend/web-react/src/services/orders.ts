import api from './api';
import type { CreateOrderRequest } from '@/types';

/** 与后端 OrderOut 对齐 */
export interface OrderLineItem {
  id: number;
  product_id: number;
  quantity: number;
  price: string;
}

export interface LogisticsEvent {
  at: string;
  status: string;
  description?: string;
  location?: string | null;
}

export interface OrderDetail {
  id: number;
  user_id: number;
  order_no: string;
  total_amount: string | number;
  status: string;
  shipping_address?: string | null;
  payment_method?: string | null;
  payment_id?: string | null;
  items: OrderLineItem[];
  carrier?: string | null;
  tracking_number?: string | null;
  logistics_events?: LogisticsEvent[];
  created_at: string;
  updated_at: string;
}

export const ordersApi = {
  create: async (data: CreateOrderRequest): Promise<OrderDetail> => {
    const response = await api.post('/orders', data);
    return response.data.data;
  },

  getById: async (id: string): Promise<OrderDetail> => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  getMyOrders: async (): Promise<OrderDetail[]> => {
    const response = await api.get('/orders/mine');
    return response.data.data;
  },

  cancel: async (id: string): Promise<OrderDetail> => {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data.data;
  },
};
