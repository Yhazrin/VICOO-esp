import api from './api';

export interface ImpactFundEntry {
  id: number;
  order_id: number;
  order_item_id: number | null;
  product_id: number;
  artwork_id: number | null;
  beneficiary_type: 'artist' | 'school' | 'charity_pool';
  beneficiary_name: string | null;
  sale_amount: string;
  donation_percentage: string;
  allocated_amount: string;
  status: string;
  created_at: string;
}

export interface ImpactFundSummary {
  total_amount: number;
  total_entries: number;
  by_type: Record<string, { amount: number; count: number }>;
}

export const impactFundApi = {
  getOrderEntries: async (orderId: string | number): Promise<ImpactFundEntry[]> => {
    const response = await api.get(`/impact-fund/orders/${orderId}/entries`);
    return response.data.data ?? [];
  },

  getSummary: async (): Promise<ImpactFundSummary> => {
    const response = await api.get('/impact-fund/summary');
    return response.data.data;
  },
};
