import api from './api';
import type { Donation, DonationTier } from '@/types';

export interface CreateDonationRequest {
  donor_name: string;
  amount: number;
  currency: string;
  payment_method: 'wechat' | 'alipay' | 'stripe' | 'paypal';
  campaign_id?: number;
  message?: string;
  is_anonymous: boolean;
}

export const donationsApi = {
  getTiers: async (): Promise<DonationTier[]> => {
    const response = await api.get<DonationTier[]>('/donations/tiers');
    return response.data;
  },

  create: async (data: CreateDonationRequest): Promise<Donation> => {
    const response = await api.post<Donation>('/donations', data);
    return response.data;
  },

  getById: async (id: string): Promise<Donation> => {
    const response = await api.get<Donation>(`/donations/${id}`);
    return response.data;
  },

  getMyDonations: async (): Promise<Donation[]> => {
    const response = await api.get<Donation[]>('/donations/mine');
    return response.data;
  },

  getImpactStats: async (): Promise<{
    totalRaised: number;
    childrenHelped: number;
    artworksCreated: number;
    productsSold: number;
  }> => {
    const response = await api.get('/donations/stats');
    return response.data;
  },
};
