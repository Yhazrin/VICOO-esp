import api from './api';

export interface SustainabilitySummary {
  donation_total_completed: string;
  clothing_intakes_listed: number;
  active_products: number;
  supply_chain_nodes: number;
  supply_chain_certified_nodes: number;
  supply_chain_verification_rate_percent: number;
  methodology_url: string;
  notes: string;
}

export const sustainabilityApi = {
  summary: async (): Promise<SustainabilitySummary> => {
    const { data } = await api.get('/sustainability/summary');
    return data.data;
  },
};
