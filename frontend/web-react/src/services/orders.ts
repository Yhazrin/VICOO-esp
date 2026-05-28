import api from './api';
import type { CreateOrderRequest } from '@/types';

/** 与后端 OrderOut 对齐 */
export interface OrderLineItem {
  id: number;
  product_id: number;
  product_name?: string | null;
  product_image?: string | null;
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
  total_amount: number;
  status: string;
  /** Signed token for demo QR payment (create order response only). */
  mock_pay_token?: string;
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

export interface OrderFilters {
  status?: string;
  keyword?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface ReturnRequestData {
  type: 'return' | 'exchange';
  items: { order_item_id: number; quantity: number }[];
  reason?: string;
  exchange_product_id?: number;
  exchange_size?: string;
  exchange_color?: string;
}

export const ordersApi = {
  create: async (data: CreateOrderRequest): Promise<OrderDetail> => {
    // P1: Idempotency key to prevent duplicate orders on rapid submit
    const idempotencyKey = crypto.randomUUID();
    const response = await api.post('/orders', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<OrderDetail> => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  getMyOrders: async (filters?: OrderFilters): Promise<OrderDetail[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.keyword) params.append('keyword', filters.keyword);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.page != null) params.append('page', String(filters.page));
    if (filters?.page_size != null) params.append('page_size', String(filters.page_size));
    const qs = params.toString();
    const response = await api.get(`/orders/mine${qs ? `?${qs}` : ''}`);
    return response.data.data;
  },

  cancel: async (id: string): Promise<OrderDetail> => {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data.data;
  },

  requestReturn: async (orderId: string, data: ReturnRequestData) => {
    const response = await api.post(`/orders/${orderId}/return`, data);
    return response.data.data;
  },
};
