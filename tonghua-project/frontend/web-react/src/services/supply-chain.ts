import api from './api';

export interface SupplyChainRecord {
  id: string;
  productId: string;
  productName: string;
  stage: string;
  location: string;
  timestamp: string;
  description: string;
  certifications: string[];
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

export const supplyChainApi = {
  getRecords: async (productId?: string): Promise<SupplyChainRecord[]> => {
    const params = productId ? { product_id: productId } : {};
    const response = await api.get('/supply-chain/records', { params });
    return response.data.data ?? [];
  },

  getProductJourney: async (productId: string): Promise<SupplyChainRecord[]> => {
    const response = await api.get(`/supply-chain/trace/${productId}`);
    return response.data.data ?? [];
  },
};
