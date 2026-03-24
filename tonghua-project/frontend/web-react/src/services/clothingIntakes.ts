import api from './api';

export interface ClothingIntake {
  id: number;
  user_id: number;
  summary: string;
  garment_types?: string | null;
  quantity_estimate: number;
  condition_notes?: string | null;
  pickup_address?: string | null;
  contact_phone?: string | null;
  status: string;
  product_id?: number | null;
  admin_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClothingIntakeCreatePayload {
  summary: string;
  garment_types?: string;
  quantity_estimate?: number;
  condition_notes?: string;
  pickup_address?: string;
  contact_phone?: string;
}

export const clothingIntakesApi = {
  create: async (body: ClothingIntakeCreatePayload): Promise<ClothingIntake> => {
    const { data } = await api.post('/clothing-intakes', body);
    return data.data;
  },
  mine: async (): Promise<ClothingIntake[]> => {
    const { data } = await api.get('/clothing-intakes/mine');
    return data.data;
  },
};
