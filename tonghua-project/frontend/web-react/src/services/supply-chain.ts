import api from './api';

interface GetRecordsParams {
  page?: number;
  page_size?: number;
  product_id?: string | number;
  stage?: string;
}

export interface SupplyChainRecord {
  id: string | number;
  product_id?: string | number;
  productId?: string | number;
  productName?: string;
  stage: string;
  location: string;
  timestamp: string;
  description: string;
  certified?: boolean;
  certifications?: string[];
  cert_image_url?: string;
  artisan?: {
    name: string;
    location: string;
    imageUrl?: string;
  };
  materials?: {
    name: string;
    origin: string;
    certified: boolean;
  }[];
}

export interface TraceResponse {
  product_id: number;
  product_name: string;
  records: SupplyChainRecord[];
}

export const supplyChainApi = {
  getRecords: async (params?: GetRecordsParams | string): Promise<SupplyChainRecord[]> => {
    const requestParams = typeof params === 'string' ? { product_id: params } : params;
    const response = await api.get('/supply-chain/records', { params: requestParams });
    return response.data.data ?? [];
  },

  getProductJourney: async (productId: string): Promise<SupplyChainRecord[]> => {
    const response = await api.get(`/supply-chain/trace/${productId}`);
    return response.data.data?.records ?? response.data.data ?? [];
  },

  trace: async (productId: string): Promise<TraceResponse> => {
    const response = await api.get(`/supply-chain/trace/${productId}`);
    return response.data.data;
  },

  getStages: async (): Promise<{ key: string; label: string; order: number }[]> => {
    const response = await api.get('/supply-chain/stages');
    return response.data.data ?? [];
  },
};
