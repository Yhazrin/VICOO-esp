import api from './api';

export interface SupplyChainRecord {
  id: number;
  product_id: number;
  stage: string;
  description: string;
  location: string;
  certified: boolean;
  cert_image_url: string | null;
  timestamp: string;
  created_at: string;
}

export interface SupplyChainTrace {
  product_id: number;
  product_name: string;
  records: SupplyChainRecord[];
}

export interface SupplyChainStage {
  key: string;
  label: string;
  order: number;
}

export const supplyChainApi = {
  getRecords: async (params?: {
    product_id?: number;
    stage?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: SupplyChainRecord[]; total: number; page: number; page_size: number }> => {
    const response = await api.get('/supply-chain/records', { params });
    const paginated = response.data;
    return {
      items: paginated.data ?? [],
      total: paginated.total ?? 0,
      page: paginated.page ?? 1,
      page_size: paginated.page_size ?? 20,
    };
  },

  trace: async (productId: string | number): Promise<SupplyChainTrace> => {
    const response = await api.get(`/supply-chain/trace/${productId}`);
    return response.data.data;
  },

  getStages: async (): Promise<SupplyChainStage[]> => {
    const response = await api.get('/supply-chain/stages');
    return response.data.data ?? [];
  },
};
