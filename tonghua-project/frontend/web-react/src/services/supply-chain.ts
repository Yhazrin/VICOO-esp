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
  cert_image_url?: string | null;
  created_at?: string;
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

function normalizeRecordList(data: unknown): SupplyChainRecord[] {
  if (Array.isArray(data)) {
    return data as SupplyChainRecord[];
  }

  if (data && typeof data === 'object') {
    const maybeData = data as { items?: unknown; records?: unknown };
    if (Array.isArray(maybeData.items)) {
      return maybeData.items as SupplyChainRecord[];
    }
    if (Array.isArray(maybeData.records)) {
      return maybeData.records as SupplyChainRecord[];
    }
  }

  return [];
}

export const supplyChainApi = {
  getRecords: async (params?: GetRecordsParams | string): Promise<SupplyChainRecord[]> => {
    const requestParams = typeof params === 'string' ? { product_id: params } : params;
    const response = await api.get('/supply-chain/records', { params: requestParams });
    return normalizeRecordList(response.data.data);
  },

  getProductJourney: async (productId: string | number): Promise<SupplyChainRecord[]> => {
    const response = await api.get(`/supply-chain/trace/${productId}`);
    return normalizeRecordList(response.data.data?.records ?? response.data.data);
  },

  trace: async (productId: string | number): Promise<TraceResponse> => {
    const response = await api.get(`/supply-chain/trace/${productId}`);
    return response.data.data;
  },

  getStages: async (): Promise<{ key: string; label: string; order: number }[]> => {
    const response = await api.get('/supply-chain/stages');
    return response.data.data ?? [];
  },
};
