import api from './api';
import type { Campaign, PaginatedResponse } from '@/types';

/** Normalize snake_case backend CampaignOut → camelCase frontend Campaign */
function normalizeCampaign(raw: Record<string, unknown>): Campaign {
  return {
    id: raw.id as number,
    title: (raw.title as string) ?? '',
    subtitle: (raw.subtitle as string) ?? '',
    description: (raw.description as string) ?? '',
    coverImageUrl: (raw.cover_image as string) ?? (raw.coverImageUrl as string) ?? '',
    startDate: (raw.start_date as string) ?? (raw.startDate as string) ?? '',
    endDate: (raw.end_date as string) ?? (raw.endDate as string) ?? '',
    status: ((raw.status as string) ?? 'active') as Campaign['status'],
    artworkCount: (raw.artwork_count as number) ?? (raw.artworkCount as number) ?? 0,
    participantCount: (raw.participant_count as number) ?? (raw.participantCount as number) ?? 0,
    goalAmount: Number(raw.goal_amount ?? raw.goalAmount ?? 0),
    raisedAmount: Number(raw.current_amount ?? raw.raisedAmount ?? 0),
    featured: (raw.featured as boolean) ?? false,
    featuredChild: raw.featuredChild as Campaign['featuredChild'],
  };
}

export const campaignsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<PaginatedResponse<Campaign>> => {
    const response = await api.get('/campaigns', { params });
    const d = response.data;
    return {
      items: (d.data ?? []).map(normalizeCampaign),
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.page_size ?? 20)),
    };
  },

  getById: async (id: string): Promise<Campaign> => {
    const response = await api.get(`/campaigns/${id}`);
    return normalizeCampaign(response.data.data);
  },

  getActive: async (): Promise<Campaign> => {
    const response = await api.get('/campaigns/active');
    return normalizeCampaign(response.data.data);
  },
};
