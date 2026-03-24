import api from './api';

export interface AfterSaleTicket {
  id: number;
  user_id: number;
  order_id: number;
  category: string;
  status: string;
  subject: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export const afterSalesApi = {
  create: async (payload: {
    order_id: number;
    category: 'return' | 'exchange' | 'quality' | 'logistics' | 'other';
    subject: string;
    description?: string;
  }): Promise<AfterSaleTicket> => {
    const { data } = await api.post('/after-sales', payload);
    return data.data;
  },
  mine: async (): Promise<AfterSaleTicket[]> => {
    const { data } = await api.get('/after-sales/mine');
    return data.data;
  },
};
