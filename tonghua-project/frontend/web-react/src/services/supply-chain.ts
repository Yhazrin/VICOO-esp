import api from './api';
import type { SupplyChainRecord, SupplyChainTrace, SupplyChainStage, PaginatedResponse } from '@/types';

export const supplyChainApi = {
  getRecords: async (params?: {
    page?: number;
    page_size?: number;
    product_id?: number;
    stage?: string;
  }): Promise<PaginatedResponse<SupplyChainRecord>> => {
    const response = await api.get('/supply-chain/records', { params });
    const d = response.data;
    return {
      items: d.data ?? [],
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.page_size ?? 20)),
    };
  },

  trace: async (productId: string | number): Promise<SupplyChainTrace> => {
    const response = await api.get(`/supply-chain/trace/${productId}`);
    return response.data.data;
  },

  getStages: async (): Promise<SupplyChainStage[]> => {
    const response = await api.get('/supply-chain/stages');
    return response.data.data;
  },
};
