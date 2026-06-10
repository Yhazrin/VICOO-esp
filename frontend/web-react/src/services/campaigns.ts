import api from './api';
import { resolveApiAssetUrl } from '@/utils/resolveApiAssetUrl';
import type { Campaign, PaginatedResponse } from '@/types';

/** Normalize snake_case backend CampaignOut → camelCase frontend Campaign */
function normalizeCampaign(raw: Record<string, unknown>): Campaign {
  const coverRaw = (raw.cover_image as string) ?? (raw.coverImageUrl as string) ?? '';
  return {
    id: raw.id as number,
    title: (raw.title as string) ?? '',
    subtitle: (raw.subtitle as string) ?? '',
    description: (raw.description as string) ?? '',
    coverImageUrl: resolveApiAssetUrl(coverRaw),
    startDate: (raw.start_date as string) ?? (raw.startDate as string) ?? '',
    endDate: (raw.end_date as string) ?? (raw.endDate as string) ?? '',
    status: ((raw.status as string) ?? 'active') as Campaign['status'],
    artworkCount: (raw.artwork_count as number) ?? (raw.artworkCount as number) ?? 0,
    participantCount: (raw.participant_count as number) ?? (raw.participantCount as number) ?? 0,
    goalAmount: Number(raw.goal_amount ?? raw.goalAmount ?? 0),
    raisedAmount: Number(raw.current_amount ?? raw.raisedAmount ?? 0),
    featured: (raw.featured as boolean) ?? false,
    featuredChild: raw.featuredChild as Campaign['featuredChild'],
    sustainabilityEyebrow: (raw.sustainability_eyebrow as string) ?? undefined,
    sustainabilityTitle: (raw.sustainability_title as string) ?? undefined,
    sustainabilitySubtitle: (raw.sustainability_subtitle as string) ?? undefined,
    sustainabilityP1Title: (raw.sustainability_p1_title as string) ?? undefined,
    sustainabilityP1Body: (raw.sustainability_p1_body as string) ?? undefined,
    sustainabilityP2Title: (raw.sustainability_p2_title as string) ?? undefined,
    sustainabilityP2Body: (raw.sustainability_p2_body as string) ?? undefined,
    sustainabilityP3Title: (raw.sustainability_p3_title as string) ?? undefined,
    sustainabilityP3Body: (raw.sustainability_p3_body as string) ?? undefined,
    sustainabilityP4Title: (raw.sustainability_p4_title as string) ?? undefined,
    sustainabilityP4Body: (raw.sustainability_p4_body as string) ?? undefined,
    sustainabilityFootnote: (raw.sustainability_footnote as string) ?? undefined,
    sustainabilityCtaTraceability: (raw.sustainability_cta_traceability as string) ?? undefined,
    sustainabilityCtaShop: (raw.sustainability_cta_shop as string) ?? undefined,
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
