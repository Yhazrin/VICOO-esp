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
  /** 旧版 / 中文 API 类目 */
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
 * 后端若未返回 is_impact_product（本地旧库常见），仅靠「关联字段」不够；
 * 用童画公益 SKU 常见名称/文案识别，避免与优衣库常规店混列。
 * 若接口显式返回 false，以接口为准。
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
    /** 与公益商店分流；务必传给后端。部分 HTTP 客户端会丢弃布尔 false，故序列化为字符串。 */
    isImpactProduct?: boolean;
  }): Promise<PaginatedResponse<Product>> => {
    const query: Record<string, string | number> = {};
    if (params?.page != null) query.page = params.page;
    if (params?.page_size != null) query.page_size = params.page_size;
    if (params?.category != null && params.category !== '') query.category = params.category;
    if (params?.isImpactProduct !== undefined) {
      query.is_impact_product = params.isImpactProduct ? 'true' : 'false';
    }
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

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return normalizeProduct(response.data.data);
  },

  getFeatured: async (): Promise<Product[]> => {
    const response = await api.get('/products/featured');
    return (response.data.data ?? []).map(normalizeProduct);
  },

  getByCategory: async (category: string): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params: { category } });
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
