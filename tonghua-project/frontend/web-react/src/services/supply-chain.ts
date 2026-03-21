import api from './api';
import type { SupplyChainRecord, PaginatedResponse } from '@/types';

interface GetRecordsParams {
  page?: number;
  page_size?: number;
  product_id?: number;
  stage?: string;
}

export interface TraceResponse {
  product_id: number;
  product_name: string;
  records: SupplyChainRecord[];
}

export const supplyChainApi = {
  getRecords: async (params?: GetRecordsParams): Promise<PaginatedResponse<SupplyChainRecord>> => {
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

  trace: async (productId: string): Promise<TraceResponse> => {
    const response = await api.get(`/supply-chain/trace/${productId}`);
    return response.data.data;
  },

  getStages: async (): Promise<{ key: string; label: string; order: number }[]> => {
    const response = await api.get('/supply-chain/stages');
    return response.data.data ?? [];
  },

  verifyCertificate: async (certificateId: string): Promise<{ valid: boolean; details: Record<string, unknown> }> => {
    const response = await api.get(`/supply-chain/verify/${certificateId}`);
    return response.data.data;
  },
};
