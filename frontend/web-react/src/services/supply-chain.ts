import api from './api';
import type { TraceMediaItem } from '@/types';

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
  carbon_kg?: number;
  carbon_note?: string;
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
  latitude?: number;
  longitude?: number;
  gallery?: TraceMediaItem[];
}

export interface SupplyChainRecordCreatePayload {
  product_id: number;
  stage: string;
  description?: string;
  location?: string;
  certified?: boolean;
  cert_image_url?: string | null;
  carbon_kg?: number;
  carbon_note?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  gallery?: TraceMediaItem[];
}

export type SupplyChainRecordPatchPayload = Partial<
  Omit<SupplyChainRecordCreatePayload, 'product_id' | 'stage'>
>;

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

  createRecord: async (payload: SupplyChainRecordCreatePayload): Promise<SupplyChainRecord> => {
    const response = await api.post('/supply-chain/records', payload);
    return response.data.data as SupplyChainRecord;
  },

  patchRecord: async (
    recordId: string | number,
    payload: SupplyChainRecordPatchPayload
  ): Promise<SupplyChainRecord> => {
    const response = await api.patch(`/supply-chain/records/${recordId}`, payload);
    return response.data.data as SupplyChainRecord;
  },

  /** 本地上传图片/视频，返回写入 gallery 用的相对路径（/static/...） */
  uploadTraceMedia: async (file: File): Promise<{ url: string; mime: string }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/supply-chain/media/upload', form, {
      timeout: 120000,
    });
    return response.data.data as { url: string; mime: string };
  },

  trace: async (productId: string | number): Promise<TraceResponse> => {
    const response = await api.get(`/supply-chain/trace/${productId}`);
    return response.data.data;
  },

  getStages: (): { key: string; label: string; order: number }[] => {
    // Static fallback — backend has no /stages endpoint
    return [
      { key: 'material_sourcing', label: 'Material Sourcing', order: 1 },
      { key: 'processing', label: 'Processing', order: 2 },
      { key: 'manufacturing', label: 'Manufacturing', order: 3 },
      { key: 'quality_check', label: 'Quality Check', order: 4 },
      { key: 'shipping', label: 'Shipping', order: 5 },
    ];
  },
};
