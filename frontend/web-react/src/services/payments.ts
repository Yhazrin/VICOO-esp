import api from './api';
import axios from 'axios';
import type { Payment, CreatePaymentRequest } from '@/types';

export interface MockPayPreview {
  order_no: string;
  total_amount: string;
  status: string;
  payment_method?: string | null;
}

export interface MockPayConfirm {
  order_no: string;
  status: string;
  already_paid: boolean;
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

  mockPreview: async (token: string): Promise<MockPayPreview> => {
    const response = await api.get<{ success: boolean; data: MockPayPreview }>(
      '/payments/mock-preview',
      { params: { token } },
    );
    return response.data.data;
  },
  
  mockConfirm: async (token: string): Promise<MockPayConfirm> => {
    const response = await api.post<{ success: boolean; data: MockPayConfirm }>(
      '/payments/mock-confirm',
      { token },
    );
    return response.data.data;
  },

  /** Cross-origin payment confirmation page: connects directly to the specified API root (must have CORS and same-origin policy allowed for mock-preview / mock-confirm) */
  mockPreviewAt: async (baseURL: string, token: string): Promise<MockPayPreview> => {
    const response = await axios.get<{ success: boolean; data: MockPayPreview }>(
      `${baseURL.replace(/\/+$/, '')}/payments/mock-preview`,
      { params: { token }, timeout: 15000 },
    );
    return response.data.data;
  },

  mockConfirmAt: async (baseURL: string, token: string): Promise<MockPayConfirm> => {
    const response = await axios.post<{ success: boolean; data: MockPayConfirm }>(
      `${baseURL.replace(/\/+$/, '')}/payments/mock-confirm`,
      { token },
      { timeout: 15000, headers: { 'Content-Type': 'application/json' } },
    );
    return response.data.data;
  },
};
