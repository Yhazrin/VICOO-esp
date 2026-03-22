import api from './api';
import type { Donation, DonationTier, CreateDonationRequest } from '@/types';

export const donationsApi = {
  getTiers: async (): Promise<DonationTier[]> => {
    const response = await api.get('/donations/tiers');
    return response.data.data;
  },

  create: async (data: CreateDonationRequest): Promise<Donation> => {
    const response = await api.post('/donations', data);
    return response.data.data;
  },

  getById: async (id: string): Promise<Donation> => {
    const response = await api.get(`/donations/${id}`);
    return response.data.data;
  },

  getMyDonations: async (): Promise<Donation[]> => {
    const response = await api.get('/donations/mine');
    return response.data.data;
  },

  getImpactStats: async (): Promise<{
    total_amount: string;
    total_donors: number;
    currency: string;
  }> => {
    const response = await api.get('/donations/stats');
    return response.data.data;
  },

  getCertificate: async (id: string): Promise<{ url: string }> => {
    const response = await api.get(`/donations/${id}/certificate`);
    return response.data.data;
  },
};
