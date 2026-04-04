import api from './api';

export interface EditorialFeedItem {
  id: string;
  title: string;
  excerpt: string;
  pull_quote?: string;
  cover_image?: string;
  author?: string;
  published_at?: string;
  read_time_minutes?: number;
  category?: 'impact' | 'fashion' | 'community' | 'education';
}

export const editorialApi = {
  getFeed: async (limit = 10): Promise<EditorialFeedItem[]> => {
    const response = await api.get('/editorial/feed', { params: { limit } });
    return response.data?.data?.items ?? [];
  },
};
