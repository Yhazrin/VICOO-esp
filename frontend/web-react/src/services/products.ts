import api from './api';
import type { Product, PaginatedResponse } from '@/types';

const CATEGORY_MAP: Record<string, Product['category']> = {
  apparel: 'apparel',
  accessories: 'accessories',
  stationery: 'stationery',
  prints: 'prints',
  lifestyle: 'lifestyle',
  footwear: 'footwear',
  home: 'home',
  gift_box: 'gift_box',
  /** Legacy / Chinese API categories */
  服装: 'apparel',
  配饰: 'accessories',
  文具: 'stationery',
  印刷: 'prints',
  生活: 'lifestyle',
  鞋履: 'footwear',
  家居: 'home',
  礼盒: 'gift_box',
};

function normalizeCategory(raw: unknown): Product['category'] {
  const key = String(raw ?? '').trim();
  return CATEGORY_MAP[key] ?? 'prints';
}

/**
 * If the backend does not return is_impact_product (common with the local legacy DB),
 * relying on "related fields" alone is insufficient; identify using common VICOO
 * welfare SKU names/copy to avoid mixing with UNIQLO regular-store products.
 * If the API explicitly returns false, defer to the API.
 */
function normalizeIsImpactProduct(raw: any): boolean {
  const v = raw?.is_impact_product ?? raw?.isImpactProduct;
  if (v === true || v === 1 || v === '1' || v === 'true') return true;
  if (v === false || v === 0 || v === '0' || v === 'false') return false;

  const name = String(raw?.name ?? '');
  const desc = String(raw?.description ?? '');
  const blob = `${name} ${desc}`;

  const looksLikeCharityLine =
    /收益|捐赠|美育|获奖作品|义卖|印有《|印有获奖|乡村美育|儿童.*画|画作化为|孩子们的画|公益明信片/.test(blob) ||
    /彩虹鱼|星星之夜|春天的花园|妈妈的手|太空旅行|画出未来|过年了|海豚之歌|牧羊曲|再生纤维披肩|手工拼布壁挂/.test(name);

  if (looksLikeCharityLine) return true;

  const hasWelfareLink =
    (raw?.campaign_id ?? raw?.campaignId) != null ||
    (raw?.artwork_id ?? raw?.artworkId) != null ||
    (raw?.donation_percentage ?? raw?.donationPercentage) != null;
  return Boolean(hasWelfareLink);
}

function normalizeProduct(raw: any): Product {
  const stockCount = Number(raw?.stock ?? raw?.stockCount ?? 0);
  const status = String(raw?.status ?? '').toLowerCase();
  const inStock = typeof raw?.inStock === 'boolean'
    ? raw.inStock
    : stockCount > 0 && status !== 'sold_out' && status !== 'inactive';

  return {
    id: Number(raw?.id ?? 0),
    name: raw?.name ?? '',
    nameEn: raw?.name_en != null && String(raw.name_en).trim() !== '' ? String(raw.name_en) : undefined,
    description: raw?.description ?? '',
    descriptionEn:
      raw?.description_en != null && String(raw.description_en).trim() !== '' ? String(raw.description_en) : undefined,
    price: Number(raw?.price ?? 0),
    currency: raw?.currency ?? 'CNY',
    image_url: raw?.image_url ?? null,
    category: normalizeCategory(raw?.category),
    inStock,
    stockCount,
    supplyChain: Array.isArray(raw?.supplyChain) ? raw.supplyChain : [],
    sustainabilityScore: Number(raw?.sustainability_score ?? raw?.sustainabilityScore ?? 85),
    artworkBy: raw?.artworkBy,
    isImpactProduct: normalizeIsImpactProduct(raw),
    campaignId: raw?.campaign_id ?? raw?.campaignId ?? null,
    artworkId: raw?.artwork_id ?? raw?.artworkId ?? undefined,
    donationPercentage: raw?.donation_percentage != null ? Number(raw.donation_percentage) : (raw?.donationPercentage != null ? Number(raw.donationPercentage) : undefined),
    originCountryId: raw?.origin_country_id ?? raw?.originCountryId ?? null,
    originRegionId: raw?.origin_region_id ?? raw?.originRegionId ?? null,
    traceStoryTitle: raw?.trace_story_title ?? raw?.traceStoryTitle ?? '',
    traceStoryContent: raw?.trace_story_content ?? raw?.traceStoryContent ?? '',
    traceStoryTitleEn:
      raw?.trace_story_title_en != null && String(raw.trace_story_title_en).trim() !== ''
        ? String(raw.trace_story_title_en)
        : undefined,
    traceStoryContentEn:
      raw?.trace_story_content_en != null && String(raw.trace_story_content_en).trim() !== ''
        ? String(raw.trace_story_content_en)
        : undefined,
    sizes: raw?.sizes ?? undefined,
    colors: raw?.colors ?? undefined,
  };
}

export const productsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    /** Used for welfare shop routing; must be sent to the backend. Some HTTP clients drop boolean false, so it is serialized as a string. */
    isImpactProduct?: boolean;
    /** Locale passed to the backend to return product names in the corresponding language. Defaults to i18n.language */
    locale?: string;
  }): Promise<PaginatedResponse<Product>> => {
    const query: Record<string, string | number> = {};
    if (params?.page != null) query.page = params.page;
    if (params?.page_size != null) query.page_size = params.page_size;
    if (params?.category != null && params.category !== '') query.category = params.category;
    if (params?.isImpactProduct !== undefined) {
      query.is_impact_product = params.isImpactProduct ? 'true' : 'false';
    }
    if (params?.locale != null) query.locale = params.locale;
    const response = await api.get('/products', { params: query });
    const d = response.data;
    return {
      items: (d.data ?? []).map(normalizeProduct),
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.pageSize ?? d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.pageSize ?? d.page_size ?? 20)),
    };
  },

  getById: async (id: string, locale?: string): Promise<Product> => {
    const query: Record<string, string> = {};
    if (locale != null) query.locale = locale;
    const response = await api.get(`/products/${id}`, { params: query });
    return normalizeProduct(response.data.data);
  },

  getFeatured: async (locale?: string): Promise<Product[]> => {
    const query: Record<string, string> = {};
    if (locale != null) query.locale = locale;
    const response = await api.get('/products/featured', { params: query });
    return (response.data.data ?? []).map(normalizeProduct);
  },

  getByCategory: async (category: string, locale?: string): Promise<PaginatedResponse<Product>> => {
    const query: Record<string, string> = { category };
    if (locale != null) query.locale = locale;
    const response = await api.get('/products', { params: query });
    const d = response.data;
    return {
      items: (d.data ?? []).map(normalizeProduct),
      total: d.total ?? 0,
      page: d.page ?? 1,
      pageSize: d.pageSize ?? d.page_size ?? 20,
      totalPages: Math.ceil((d.total ?? 0) / (d.pageSize ?? d.page_size ?? 20)),
    };
  },

  getArtwork: async (productId: string | number): Promise<any | null> => {
    const response = await api.get(`/products/${productId}/artwork`);
    return response.data.data ?? null;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/products/categories');
    const rows = response.data.data ?? [];
    return rows
      .map((row: any) => normalizeCategory(row?.name ?? row))
      .filter((value: Product['category'], index: number, arr: Product['category'][]) => arr.indexOf(value) === index);
  },
};
