import api from './api';
import axios from 'axios';
import type { Payment, CreatePaymentRequest } from '@/types';

export interface MockPayPreview {
  order_no?: string;
  orderNo?: string;
  total_amount?: string;
  totalAmount?: string;
  status: string;
  payment_method?: string | null;
  paymentMethod?: string | null;
}

export interface MockPayConfirm {
  order_no: string;
  status: string;
  already_paid: boolean;
}

export interface MockDonationPayPreview {
  donation_id?: number;
  donationId?: number;
  amount?: string;
  status: string;
  payment_method?: string | null;
  paymentMethod?: string | null;
  campaign_id?: number | null;
  campaignId?: number | null;
}

export interface MockDonationPayConfirm {
  donation_id?: number;
  donationId?: number;
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

  /** 跨域支付确认页：直连指定 API 根（须与 mock-preview / mock-confirm 同源策略、CORS 已放行） */
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

  mockDonationPreview: async (token: string): Promise<MockDonationPayPreview> => {
    const response = await api.get<{ success: boolean; data: MockDonationPayPreview }>(
      '/payments/mock-donation-preview',
      { params: { token } },
    );
    return response.data.data;
  },

  mockDonationConfirm: async (token: string): Promise<MockDonationPayConfirm> => {
    const response = await api.post<{ success: boolean; data: MockDonationPayConfirm }>(
      '/payments/mock-donation-confirm',
      { token },
    );
    return response.data.data;
  },

  mockDonationPreviewAt: async (baseURL: string, token: string): Promise<MockDonationPayPreview> => {
    const response = await axios.get<{ success: boolean; data: MockDonationPayPreview }>(
      `${baseURL.replace(/\/+$/, '')}/payments/mock-donation-preview`,
      { params: { token }, timeout: 15000 },
    );
    return response.data.data;
  },

  mockDonationConfirmAt: async (baseURL: string, token: string): Promise<MockDonationPayConfirm> => {
    const response = await axios.post<{ success: boolean; data: MockDonationPayConfirm }>(
      `${baseURL.replace(/\/+$/, '')}/payments/mock-donation-confirm`,
      { token },
      { timeout: 15000, headers: { 'Content-Type': 'application/json' } },
    );
    return response.data.data;
  },
};
