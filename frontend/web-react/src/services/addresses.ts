import api from './api';

export interface Address {
  id: number;
  user_id: number;
  label: string | null;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string | null;
  detail_address: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressCreateData {
  label?: string;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district?: string;
  detail_address: string;
  postal_code?: string;
  is_default?: boolean;
}

export interface AddressUpdateData {
  label?: string;
  recipient_name?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  detail_address?: string;
  postal_code?: string;
  is_default?: boolean;
}

export const addressesApi = {
  getAll: async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    return response.data.data;
  },

  create: async (data: AddressCreateData): Promise<Address> => {
    const response = await api.post('/addresses', data);
    return response.data.data;
  },

  update: async (id: number, data: AddressUpdateData): Promise<Address> => {
    const response = await api.put(`/addresses/${id}`, data);
    return response.data.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  setDefault: async (id: number): Promise<Address> => {
    const response = await api.put(`/addresses/${id}/default`);
    return response.data.data;
  },
};
