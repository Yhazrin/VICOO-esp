import api from './api';
import type { Donation, DonationTier, CreateDonationRequest, PaginatedResponse } from '@/types';

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

  getMine: async (page = 1, pageSize = 20): Promise<PaginatedResponse<Donation>> => {
    const response = await api.get('/donations/mine', { params: { page, page_size: pageSize } });
    const d = response.data;
    return {
      items: d.data ?? [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.page_size ?? 20)),
    };
  },

  getImpactStats: async (): Promise<{
    total_amount: string;
    total_donors: number;
    currency: string;
  }> => {
    const response = await api.get('/donations/stats');
    return response.data.data;
  },

  getCertificate: async (id: string): Promise<{
    donation_id: number;
    donor_name: string;
    amount: string;
    currency: string;
    date: string;
    campaign_id: number | null;
    certificate_no: string;
    certificate_url: string;
  }> => {
    const response = await api.get(`/donations/${id}/certificate`);
    return response.data.data;
  },
};
