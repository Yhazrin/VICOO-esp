import api from './api';

export interface AfterSaleTicket {
  id: number;
  user_id: number;
  order_id: number;
  order_no?: string | null;
  reason?: string | null;
  category: string;
  status: string;
  subject: string;
  description?: string | null;
  admin_note?: string | null;
  return_carrier?: string | null;
  return_tracking_no?: string | null;
  refund_amount?: string | null;
  refund_status?: string | null;
  goods_received_at?: string | null;
  replacement_order_id?: number | null;
  replacement_order_no?: string | null;
  replacement_order_status?: string | null;
  replacement_carrier?: string | null;
  replacement_tracking_number?: string | null;
  image_urls?: string[];
  created_at: string;
  updated_at: string;
}

export const afterSalesApi = {
  create: async (payload: {
    order_id: number;
    category: 'quality' | 'logistics' | 'other';
    subject: string;
    description?: string;
    image_urls?: string[];
  }): Promise<AfterSaleTicket> => {
    const { data } = await api.post('/after-sales', payload);
    return data.data;
  },
  mine: async (): Promise<AfterSaleTicket[]> => {
    const { data } = await api.get('/after-sales/mine');
    return data.data ?? [];
  },
  byOrder: async (orderId: string | number): Promise<AfterSaleTicket[]> => {
    const { data } = await api.get(`/after-sales/by-order/${orderId}`);
    return data.data ?? [];
  },
  submitReturnShipment: async (
    ticketId: number,
    payload: { return_carrier: string; return_tracking_no: string },
  ): Promise<AfterSaleTicket> => {
    const { data } = await api.patch(`/after-sales/${ticketId}/return-shipment`, payload);
    return data.data;
  },
};
