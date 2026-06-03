import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import type {
  Artwork, Campaign, Donation, Order, User,
  AuditLogEntry, DashboardMetrics,
  ChartDataPoint, SystemSettings, SystemHealth, FilterParams, PaginatedResponse,
  DonationListSummary,
  AdminProduct, OriginCountry, OriginRegion,
  SupplyChainRecord, TraceMediaItem,
  AfterSalesItem, ClothingDonationItem,
} from '../types';


// ---------------------------------------------------------------------------
// Axios instance – baseURL is /api/v1 (not /api/v1/admin) because some
// requests go through /admin/... and others through /artworks, /orders, etc.
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  withCredentials: true, // Send httpOnly cookies with every request
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function onRefreshed(newToken: string) {
  refreshQueue.forEach((sub) => sub.resolve(newToken));
  refreshQueue = [];
}

function onRefreshFailed(err: unknown) {
  refreshQueue.forEach((sub) => sub.reject(err));
  refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't retry the refresh request itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        useAuthStore.getState().logout();
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: () => {
              originalRequest._retry = true;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const { access_token } = refreshRes.data.data;
        useAuthStore.getState().setAccessToken(access_token);
        isRefreshing = false;
        onRefreshed(access_token);
        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshFailed(refreshErr);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

// ---------------------------------------------------------------------------
// Helper: adapt a paginated API response to the frontend PaginatedResponse
// Backend returns { success, data, total, page, page_size, pageSize }
// Frontend expects { data, total, page, pageSize, totalPages }
// ---------------------------------------------------------------------------
function adaptPaginated<T>(raw: any): PaginatedResponse<T> {
  const total: number = raw.total ?? 0;
  const pageSize: number = raw.pageSize ?? raw.page_size ?? 20;
  return {
    data: raw.data ?? [],
    total,
    page: raw.page ?? 1,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Migrated API functions – real HTTP requests
// ---------------------------------------------------------------------------

/**
 * Fetch dashboard metrics from GET /admin/dashboard.
 * Backend returns snake_case; we map to the frontend's camelCase DashboardMetrics.
 */
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data: envelope } = await api.get('/admin/dashboard');
  const d = envelope.data;
  return {
    totalArtworks: d.total_artworks ?? 0,
    pendingArtworks: d.pending_artworks ?? 0,
    totalDonations: d.total_donations ?? 0,
    totalDonationAmount: parseFloat(d.total_donation_amount ?? '0') || 0,
    totalOrders: d.total_orders ?? 0,
    totalUsers: d.total_users ?? 0,
    activeCampaigns: d.active_campaigns ?? 0,
    childParticipants: d.total_clothing_donations ?? d.child_participants ?? 0,
  };
}

/**
 * Fetch donation analytics from GET /admin/analytics/donations.
 * Backend returns { by_method: [{method, count, total}], by_campaign: [...] }.
 * Frontend expects ChartDataPoint[] with name, value, and per-method amounts.
 * We transform by_method into a single ChartDataPoint "total" entry, or if the
 * shape changes later we can adapt accordingly.
 */
export async function fetchDonationTrend(): Promise<ChartDataPoint[]> {
  const { data: envelope } = await api.get('/admin/analytics/donations');
  const d = envelope.data;
  // If backend returns by_method, transform into chart-friendly format
  if (d.by_method && Array.isArray(d.by_method)) {
    // Build a single summary point from payment-method breakdown
    const point: ChartDataPoint = { name: 'total', value: 0 };
    for (const m of d.by_method) {
      const amt = parseFloat(m.total ?? '0') || 0;
      point[m.method] = amt;
      point.value = (point.value as number) + amt;
    }
    return [point];
  }
  // Fallback: if backend already returns array
  return Array.isArray(d) ? d : [];
}

/**
 * Fetch artwork analytics from GET /admin/analytics/artworks.
 * Backend returns { by_status: {...}, total_views, total_likes }.
 * Frontend expects ChartDataPoint[] with name (category) and value (count).
 */
export async function fetchArtworkByCategory(): Promise<ChartDataPoint[]> {
  const { data: envelope } = await api.get('/admin/analytics/artworks');
  const d = envelope.data;
  if (d.by_status) {
    return Object.entries(d.by_status).map(([name, value]) => ({
      name,
      value: value as number,
    }));
  }
  return Array.isArray(d) ? d : [];
}

/**
 * Fetch order analytics from GET /admin/analytics/orders.
 * Backend returns { by_status: {...}, total_revenue }.
 * Frontend expects ChartDataPoint[] with name (status) and value (count).
 */
export async function fetchOrderTrend(): Promise<ChartDataPoint[]> {
  const { data: envelope } = await api.get('/admin/analytics/orders');
  const d = envelope.data;
  if (d.by_status) {
    return Object.entries(d.by_status).map(([name, value]) => ({
      name,
      value: value as number,
    }));
  }
  return Array.isArray(d) ? d : [];
}

/**
 * Fetch user analytics from GET /admin/analytics/users.
 * Backend returns { by_role: {...}, by_month: [{month, count}] }.
 * Frontend expects ChartDataPoint[] with name (month) and value (count).
 */
export async function fetchUserGrowth(): Promise<ChartDataPoint[]> {
  const { data: envelope } = await api.get('/admin/analytics/users');
  const d = envelope.data;
  if (d.by_month && Array.isArray(d.by_month)) {
    return d.by_month.map((item: any) => ({
      name: item.month,
      value: item.count,
    }));
  }
  return Array.isArray(d) ? d : [];
}

/**
 * Fetch audit logs from GET /admin/audit-logs.
 * Backend uses snake_case (AuditLogOut), frontend uses camelCase (AuditLogEntry).
 */
export async function fetchAuditLogs(params: FilterParams = {}): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data: envelope } = await api.get('/admin/audit-logs', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      action: params.search || undefined,
      resource: params.status || undefined,
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  return {
    ...paginated,
    data: paginated.data.map((item: any) => ({
      id: String(item.id),
      userId: String(item.user_id ?? ''),
      userName: item.user_name ?? '',
      action: item.action ?? '',
      resource: item.resource ?? '',
      resourceId: item.resource_id ? String(item.resource_id) : undefined,
      details: item.details ?? '',
      ipAddress: item.ip_address ?? '',
      userAgent: item.user_agent ?? '',
      timestamp: item.timestamp ?? '',
    })),
  };
}

/**
 * Fetch artworks from GET /artworks (business route, no /admin prefix).
 * Backend returns snake_case fields; maps to frontend camelCase Artwork.
 */
export async function fetchArtworks(params: FilterParams = {}): Promise<PaginatedResponse<Artwork>> {
  const { data: envelope } = await api.get('/artworks', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      status: params.status || undefined,
      search: params.search || undefined,
      campaign_id: params.campaignId || undefined,
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  return {
    ...paginated,
    data: paginated.data.map((item: any) => ({
      id: String(item.id),
      title: item.title ?? '',
      description: item.description ?? '',
      childName: item.artist_name ?? item.childParticipant?.firstName ?? '',
      childAge: item.childParticipant?.age ?? 0,
      imageUrl: item.image_url ?? item.imageUrl ?? '',
      status: item.status ?? 'pending',
      category: item.category ?? '',
      campaignId: item.campaign_id ? String(item.campaign_id) : undefined,
      votes: item.vote_count ?? item.like_count ?? item.votes ?? 0,
      createdAt: item.created_at ?? '',
      reviewedAt: item.reviewed_at,
      reviewedBy: item.reviewed_by,
    })),
  };
}

/**
 * Update artwork status via PUT /artworks/{id}/status.
 */
export async function updateArtworkStatus(id: string, status: Artwork['status']): Promise<Artwork> {
  const { data: envelope } = await api.put(`/artworks/${id}/status`, { status });
  const item = envelope.data;
  return {
    id: String(item.id),
    title: item.title ?? '',
    description: item.description ?? '',
    childName: item.artist_name ?? item.childParticipant?.firstName ?? '',
    childAge: item.childParticipant?.age ?? 0,
    imageUrl: item.image_url ?? item.imageUrl ?? '',
    status: item.status ?? status,
    category: item.category ?? '',
    campaignId: item.campaign_id ? String(item.campaign_id) : undefined,
    votes: item.vote_count ?? item.like_count ?? item.votes ?? 0,
    createdAt: item.created_at ?? '',
    reviewedAt: item.reviewed_at,
    reviewedBy: item.reviewed_by,
  };
}

/**
 * Update artwork fields via PUT /artworks/{id}.
 */
export async function updateArtwork(
  id: string,
  payload: Partial<Pick<Artwork, 'title' | 'description' | 'imageUrl'>>,
): Promise<Artwork> {
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.imageUrl !== undefined) body.image_url = payload.imageUrl;
  const { data: envelope } = await api.put(`/artworks/${id}`, body);
  const item = envelope.data;
  return {
    id: String(item.id),
    title: item.title ?? '',
    description: item.description ?? '',
    childName: item.artist_name ?? item.childParticipant?.firstName ?? '',
    childAge: item.childParticipant?.age ?? 0,
    imageUrl: item.image_url ?? item.imageUrl ?? '',
    status: item.status ?? 'pending',
    category: item.category ?? '',
    campaignId: item.campaign_id ? String(item.campaign_id) : undefined,
    votes: item.vote_count ?? item.like_count ?? item.votes ?? 0,
    createdAt: item.created_at ?? '',
    reviewedAt: item.reviewed_at,
    reviewedBy: item.reviewed_by,
  };
}

/**
 * Delete artwork via DELETE /artworks/{id}.
 */
export async function deleteArtwork(id: string): Promise<void> {
  await api.delete(`/artworks/${id}`);
}

/**
 * Fetch orders from GET /orders (business route, no /admin prefix).
 */
export async function fetchOrders(params: FilterParams = {}): Promise<PaginatedResponse<Order>> {
  const { data: envelope } = await api.get('/orders', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      status: params.status || undefined,
      search: params.search || undefined,
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  return {
    ...paginated,
    data: paginated.data.map((item: any) => ({
      id: String(item.id),
      orderNo: item.order_no ?? '',
      userId: String(item.user_id ?? ''),
      userName: item.user_name ?? (item.user_id != null ? `用户 #${item.user_id}` : ''),
      items: (item.items ?? []).map((it: any) => ({
        productId: String(it.product_id ?? ''),
        productName: it.product_name ?? '',
        quantity: it.quantity ?? 0,
        price: parseFloat(it.price ?? '0') || 0,
        imageUrl: it.product_image ?? it.image_url ?? '',
      })),
      totalAmount: parseFloat(item.total_amount ?? '0') || 0,
      status: item.status ?? 'pending',
      paymentMethod: item.payment_method ?? '',
      shippingAddress: item.shipping_address ?? '',
      trackingNo: item.tracking_number ?? item.trackingNo,
      createdAt: item.created_at ?? '',
      paidAt: item.paid_at,
      shippedAt: item.shipped_at,
    })),
  };
}

/**
 * Update order status via PUT /orders/{id}/status.
 * (Backend also has /logistics for carrier/tracking updates, but for simple
 * status changes we use /status which matches OrderStatusUpdate schema.)
 */
export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
  const { data: envelope } = await api.put(`/orders/${id}/status`, { status });
  const item = envelope.data;
  return {
    id: String(item.id),
    orderNo: item.order_no ?? '',
    userId: String(item.user_id ?? ''),
    userName: item.user_name ?? '',
    items: (item.items ?? []).map((it: any) => ({
      productId: String(it.product_id ?? ''),
      productName: it.product_name ?? '',
      quantity: it.quantity ?? 0,
      price: parseFloat(it.price ?? '0') || 0,
      imageUrl: it.product_image ?? it.image_url ?? '',
    })),
    totalAmount: parseFloat(item.total_amount ?? '0') || 0,
    status: item.status ?? status,
    paymentMethod: item.payment_method ?? '',
    shippingAddress: item.shipping_address ?? '',
    trackingNo: item.tracking_number ?? item.trackingNo,
    createdAt: item.created_at ?? '',
    paidAt: item.paid_at,
    shippedAt: item.shipped_at,
  };
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

function adaptCampaign(item: any): Campaign {
  const rawStatus = item.status ?? 'draft';
  const status =
    rawStatus === 'completed'
      ? 'ended'
      : rawStatus === 'cancelled'
        ? 'archived'
        : rawStatus;
  return {
    id: String(item.id),
    title: item.title ?? '',
    subtitle: item.subtitle ?? '',
    description: item.description ?? '',
    startDate: item.start_date ?? '',
    endDate: item.end_date ?? '',
    status: status as Campaign['status'],
    targetAmount: parseFloat(item.goal_amount ?? '0') || 0,
    raisedAmount: parseFloat(item.current_amount ?? '0') || 0,
    participantCount: item.participant_count ?? 0,
    artworkCount: item.artwork_count ?? 0,
    coverImage: item.cover_image,
    createdAt: item.created_at ?? '',
    sustainabilityEyebrow: item.sustainability_eyebrow ?? '',
    sustainabilityTitle: item.sustainability_title ?? '',
    sustainabilitySubtitle: item.sustainability_subtitle ?? '',
    sustainabilityP1Title: item.sustainability_p1_title ?? '',
    sustainabilityP1Body: item.sustainability_p1_body ?? '',
    sustainabilityP2Title: item.sustainability_p2_title ?? '',
    sustainabilityP2Body: item.sustainability_p2_body ?? '',
    sustainabilityP3Title: item.sustainability_p3_title ?? '',
    sustainabilityP3Body: item.sustainability_p3_body ?? '',
    sustainabilityP4Title: item.sustainability_p4_title ?? '',
    sustainabilityP4Body: item.sustainability_p4_body ?? '',
    sustainabilityFootnote: item.sustainability_footnote ?? '',
    sustainabilityCtaTraceability: item.sustainability_cta_traceability ?? '',
    sustainabilityCtaShop: item.sustainability_cta_shop ?? '',
  };
}

export async function fetchCampaigns(params: FilterParams = {}): Promise<PaginatedResponse<Campaign>> {
  let status = params.status || undefined;
  if (status === 'ended') status = 'completed';
  if (status === 'archived') status = 'cancelled';
  const { data: envelope } = await api.get('/campaigns', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      status: status || undefined,
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  return { ...paginated, data: paginated.data.map(adaptCampaign) };
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  const { data: envelope } = await api.post('/campaigns', {
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    start_date: data.startDate,
    end_date: data.endDate,
    goal_amount: data.targetAmount,
    cover_image: data.coverImage,
    sustainability_eyebrow: data.sustainabilityEyebrow,
    sustainability_title: data.sustainabilityTitle,
    sustainability_subtitle: data.sustainabilitySubtitle,
    sustainability_p1_title: data.sustainabilityP1Title,
    sustainability_p1_body: data.sustainabilityP1Body,
    sustainability_p2_title: data.sustainabilityP2Title,
    sustainability_p2_body: data.sustainabilityP2Body,
    sustainability_p3_title: data.sustainabilityP3Title,
    sustainability_p3_body: data.sustainabilityP3Body,
    sustainability_p4_title: data.sustainabilityP4Title,
    sustainability_p4_body: data.sustainabilityP4Body,
    sustainability_footnote: data.sustainabilityFootnote,
    sustainability_cta_traceability: data.sustainabilityCtaTraceability,
    sustainability_cta_shop: data.sustainabilityCtaShop,
  });
  return adaptCampaign(envelope.data);
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  const body: Record<string, any> = {};
  if (data.title !== undefined) body.title = data.title;
  if (data.subtitle !== undefined) body.subtitle = data.subtitle;
  if (data.description !== undefined) body.description = data.description;
  if (data.startDate !== undefined) body.start_date = data.startDate;
  if (data.endDate !== undefined) body.end_date = data.endDate;
  if (data.targetAmount !== undefined) {
    const g = Number(data.targetAmount);
    if (Number.isFinite(g) && g > 0) body.goal_amount = g;
  }
  if (data.coverImage !== undefined) body.cover_image = data.coverImage;
  if (data.status !== undefined) {
    let s = data.status;
    if (s === 'ended') s = 'completed' as typeof s;
    if (s === 'archived') s = 'cancelled' as typeof s;
    body.status = s;
  }
  // Sustainability fields
  if (data.sustainabilityEyebrow !== undefined) body.sustainability_eyebrow = data.sustainabilityEyebrow;
  if (data.sustainabilityTitle !== undefined) body.sustainability_title = data.sustainabilityTitle;
  if (data.sustainabilitySubtitle !== undefined) body.sustainability_subtitle = data.sustainabilitySubtitle;
  if (data.sustainabilityP1Title !== undefined) body.sustainability_p1_title = data.sustainabilityP1Title;
  if (data.sustainabilityP1Body !== undefined) body.sustainability_p1_body = data.sustainabilityP1Body;
  if (data.sustainabilityP2Title !== undefined) body.sustainability_p2_title = data.sustainabilityP2Title;
  if (data.sustainabilityP2Body !== undefined) body.sustainability_p2_body = data.sustainabilityP2Body;
  if (data.sustainabilityP3Title !== undefined) body.sustainability_p3_title = data.sustainabilityP3Title;
  if (data.sustainabilityP3Body !== undefined) body.sustainability_p3_body = data.sustainabilityP3Body;
  if (data.sustainabilityP4Title !== undefined) body.sustainability_p4_title = data.sustainabilityP4Title;
  if (data.sustainabilityP4Body !== undefined) body.sustainability_p4_body = data.sustainabilityP4Body;
  if (data.sustainabilityFootnote !== undefined) body.sustainability_footnote = data.sustainabilityFootnote;
  if (data.sustainabilityCtaTraceability !== undefined) body.sustainability_cta_traceability = data.sustainabilityCtaTraceability;
  if (data.sustainabilityCtaShop !== undefined) body.sustainability_cta_shop = data.sustainabilityCtaShop;
  const { data: envelope } = await api.put(`/campaigns/${id}`, body);
  return adaptCampaign(envelope.data);
}

export async function deleteCampaign(id: string): Promise<void> {
  await api.delete(`/campaigns/${id}`);
}

// ---------------------------------------------------------------------------
// Products (Admin)
// ---------------------------------------------------------------------------

function adaptAdminProduct(item: any): AdminProduct {
  return {
    id: String(item.id),
    name: item.name ?? '',
    description: item.description ?? '',
    price: parseFloat(item.price ?? '0') || 0,
    currency: item.currency ?? 'CNY',
    imageUrl: item.image_url ?? undefined,
    category: item.category ?? undefined,
    stock: Number(item.stock ?? 0),
    status: item.status ?? 'active',
    isImpactProduct: Boolean(item.is_impact_product),
    campaignId: item.campaign_id != null ? String(item.campaign_id) : undefined,
    donationPercentage: item.donation_percentage != null ? Number(item.donation_percentage) : undefined,
    artworkId: item.artwork_id != null ? String(item.artwork_id) : undefined,
    originCountryId: item.origin_country_id != null ? String(item.origin_country_id) : undefined,
    originRegionId: item.origin_region_id != null ? String(item.origin_region_id) : undefined,
    traceStoryTitle: item.trace_story_title ?? '',
    traceStoryContent: item.trace_story_content ?? '',
    nameEn: item.name_en ?? '',
    descriptionEn: item.description_en ?? '',
    traceStoryTitleEn: item.trace_story_title_en ?? '',
    traceStoryContentEn: item.trace_story_content_en ?? '',
    createdAt: item.created_at ?? '',
  };
}

export async function fetchProducts(params: FilterParams = {}): Promise<PaginatedResponse<AdminProduct>> {
  const { data: envelope } = await api.get('/products', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      status: params.status || undefined,
      is_impact_product: params.isImpactProduct,
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  return { ...paginated, data: paginated.data.map(adaptAdminProduct) };
}

export async function createProduct(payload: Partial<AdminProduct>): Promise<AdminProduct> {
  const { data: envelope } = await api.post('/products', {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    currency: payload.currency ?? 'CNY',
    image_url: payload.imageUrl || null,
    category: payload.category || null,
    stock: payload.stock ?? 0,
    status: payload.status ?? 'active',
    is_impact_product: payload.isImpactProduct ?? false,
    campaign_id: payload.campaignId ? Number(payload.campaignId) : null,
    donation_percentage: payload.donationPercentage ?? null,
    artwork_id: payload.artworkId ? Number(payload.artworkId) : null,
    origin_country_id: payload.originCountryId ? Number(payload.originCountryId) : null,
    origin_region_id: payload.originRegionId ? Number(payload.originRegionId) : null,
    trace_story_title: payload.traceStoryTitle || null,
    trace_story_content: payload.traceStoryContent || null,
    name_en: payload.nameEn?.trim() || null,
    description_en: payload.descriptionEn?.trim() || null,
    trace_story_title_en: payload.traceStoryTitleEn?.trim() || null,
    trace_story_content_en: payload.traceStoryContentEn?.trim() || null,
  });
  return adaptAdminProduct(envelope.data);
}

export async function updateProduct(id: string, payload: Partial<AdminProduct>): Promise<AdminProduct> {
  const { data: envelope } = await api.put(`/products/${id}`, {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    currency: payload.currency,
    image_url: payload.imageUrl,
    category: payload.category,
    stock: payload.stock,
    status: payload.status,
    is_impact_product: payload.isImpactProduct,
    campaign_id: payload.campaignId ? Number(payload.campaignId) : null,
    donation_percentage: payload.donationPercentage,
    artwork_id: payload.artworkId ? Number(payload.artworkId) : null,
    origin_country_id: payload.originCountryId ? Number(payload.originCountryId) : null,
    origin_region_id: payload.originRegionId ? Number(payload.originRegionId) : null,
    trace_story_title: payload.traceStoryTitle,
    trace_story_content: payload.traceStoryContent,
    name_en: payload.nameEn?.trim() || null,
    description_en: payload.descriptionEn?.trim() || null,
    trace_story_title_en: payload.traceStoryTitleEn?.trim() || null,
    trace_story_content_en: payload.traceStoryContentEn?.trim() || null,
  });
  return adaptAdminProduct(envelope.data);
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

// ---------------------------------------------------------------------------
// Supply Chain Records
// ---------------------------------------------------------------------------

function adaptSupplyChainRecord(item: any): SupplyChainRecord {
  return {
    id: String(item.id),
    productId: String(item.product_id),
    stage: item.stage,
    description: item.description ?? '',
    descriptionEn: item.description_en ?? '',
    location: item.location ?? '',
    locationEn: item.location_en ?? '',
    latitude: item.latitude,
    longitude: item.longitude,
    certified: item.certified ?? false,
    certImageUrl: item.cert_image_url,
    carbonKg: item.carbon_kg,
    carbonNote: item.carbon_note,
    timestamp: item.timestamp ?? '',
    gallery: (item.gallery ?? []).map((g: any) => ({
      type: g.type ?? 'image',
      url: g.url ?? '',
      caption: g.caption,
    })),
    createdAt: item.created_at ?? '',
  };
}

export async function fetchSupplyChainRecords(productId: string): Promise<SupplyChainRecord[]> {
  const { data: envelope } = await api.get('/supply-chain/records', {
    params: { product_id: Number(productId), page_size: 100 },
  });
  return (envelope.data ?? []).map(adaptSupplyChainRecord);
}

export async function createSupplyChainRecord(
  productId: string,
  payload: Omit<SupplyChainRecord, 'id' | 'productId' | 'createdAt'>,
): Promise<SupplyChainRecord> {
  const { data: envelope } = await api.post('/supply-chain/records', {
    product_id: Number(productId),
    stage: payload.stage,
    description: payload.description,
    description_en: payload.descriptionEn,
    location: payload.location,
    location_en: payload.locationEn,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    certified: payload.certified,
    cert_image_url: payload.certImageUrl ?? null,
    carbon_kg: payload.carbonKg ?? null,
    carbon_note: payload.carbonNote ?? null,
    timestamp: payload.timestamp || new Date().toISOString(),
    gallery: payload.gallery ?? [],
  });
  return adaptSupplyChainRecord(envelope.data);
}

export async function updateSupplyChainRecord(
  recordId: string,
  payload: Partial<Omit<SupplyChainRecord, 'id' | 'productId' | 'createdAt'>>,
): Promise<SupplyChainRecord> {
  const body: any = {};
  if (payload.stage !== undefined) body.stage = payload.stage;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.descriptionEn !== undefined) body.description_en = payload.descriptionEn;
  if (payload.location !== undefined) body.location = payload.location;
  if (payload.locationEn !== undefined) body.location_en = payload.locationEn;
  if (payload.latitude !== undefined) body.latitude = payload.latitude;
  if (payload.longitude !== undefined) body.longitude = payload.longitude;
  if (payload.certified !== undefined) body.certified = payload.certified;
  if (payload.certImageUrl !== undefined) body.cert_image_url = payload.certImageUrl;
  if (payload.carbonKg !== undefined) body.carbon_kg = payload.carbonKg;
  if (payload.carbonNote !== undefined) body.carbon_note = payload.carbonNote;
  if (payload.timestamp !== undefined) body.timestamp = payload.timestamp;
  if (payload.gallery !== undefined) body.gallery = payload.gallery;
  const { data: envelope } = await api.patch(`/supply-chain/records/${recordId}`, body);
  return adaptSupplyChainRecord(envelope.data);
}

export async function deleteSupplyChainRecord(recordId: string): Promise<void> {
  await api.delete(`/supply-chain/records/${recordId}`);
}

export async function uploadTraceMedia(file: File): Promise<{ url: string; mime: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data: envelope } = await api.post('/supply-chain/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return envelope.data as { url: string; mime: string };
}

export async function fetchOriginCountries(): Promise<OriginCountry[]> {
  const { data: envelope } = await api.get('/products/origins/countries');
  return (envelope.data ?? []).map((item: any) => ({
    id: String(item.id),
    code: item.code ?? '',
    nameZh: item.name_zh ?? '',
    nameEn: item.name_en ?? '',
  }));
}

export async function fetchOriginRegions(countryId?: string): Promise<OriginRegion[]> {
  const { data: envelope } = await api.get('/products/origins/regions', {
    params: { country_id: countryId ? Number(countryId) : undefined },
  });
  return (envelope.data ?? []).map((item: any) => ({
    id: String(item.id),
    countryId: String(item.country_id),
    nameZh: item.name_zh ?? '',
    nameEn: item.name_en ?? '',
    regionType: item.region_type ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// Donations
// ---------------------------------------------------------------------------

function adaptDonation(item: any): Donation {
  return {
    id: String(item.id),
    donorName: item.donor_name ?? '',
    donorEmail: item.donor_email ?? '',
    amount: parseFloat(item.amount ?? '0') || 0,
    currency: item.currency ?? 'CNY',
    paymentMethod: item.payment_method ?? 'wechat',
    status: item.status ?? 'pending',
    campaignId: item.campaign_id ? String(item.campaign_id) : undefined,
    campaignTitle: item.campaign_title,
    message: item.message,
    isAnonymous: item.is_anonymous ?? false,
    transactionId: item.payment_id ?? '',
    createdAt: item.created_at ?? '',
  };
}

export async function approveDonationAdmin(id: string): Promise<Donation> {
  const { data: envelope } = await api.post(`/admin/donations/${id}/approve`);
  return adaptDonation(envelope.data);
}

export async function fetchDonations(
  params: FilterParams = {},
): Promise<PaginatedResponse<Donation> & { summary: DonationListSummary }> {
  const { data: envelope } = await api.get('/donations', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      status: params.status || undefined,
      payment_method: params.paymentMethod || undefined,
      search: params.search || undefined,
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  const s = envelope.summary as
    | {
        selection_total: number;
        completed_count: number;
        failed_count: number;
        completed_amount_total: string;
      }
    | undefined;
  return {
    ...paginated,
    data: paginated.data.map(adaptDonation),
    summary: {
      selectionTotal: s?.selection_total ?? paginated.total,
      completedCount: s?.completed_count ?? 0,
      failedCount: s?.failed_count ?? 0,
      completedAmountTotal: s?.completed_amount_total ?? '0',
    },
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

function adaptUser(item: any): User {
  return {
    id: String(item.id),
    username: item.nickname ?? item.email ?? '',
    email: item.email ?? '',
    role: item.role ?? 'user',
    status: item.status ?? 'active',
    avatar: item.avatar,
    createdAt: item.created_at ?? '',
    lastLogin: item.last_login,
  };
}

export async function fetchUsers(params: FilterParams = {}): Promise<PaginatedResponse<User>> {
  const { data: envelope } = await api.get('/users', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      ...(params.search ? { search: params.search } : {}),
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  return { ...paginated, data: paginated.data.map(adaptUser) };
}

export async function updateUserRole(id: string, role: User['role']): Promise<User> {
  const { data: envelope } = await api.put(`/users/${id}/role`, { role });
  return adaptUser(envelope.data);
}

export async function updateUserStatus(id: string, status: User['status']): Promise<User> {
  const { data: envelope } = await api.put(`/users/${id}/status`, { status });
  return adaptUser(envelope.data);
}

// ---------------------------------------------------------------------------
// After-Sales
// ---------------------------------------------------------------------------

const AFTER_SALE_STATUS_FROM_API: Record<string, string> = {
  open: 'pending',
  in_progress: 'approved',
  closed: 'rejected',
  resolved: 'completed',
};

const AFTER_SALE_STATUS_TO_API: Record<string, string> = {
  pending: 'open',
  approved: 'in_progress',
  rejected: 'closed',
  completed: 'resolved',
};

export async function fetchAfterSales(params: FilterParams = {}): Promise<PaginatedResponse<AfterSalesItem>> {
  const apiStatus = params.status
    ? AFTER_SALE_STATUS_TO_API[params.status] ?? params.status
    : undefined;
  const { data: envelope } = await api.get('/after-sales', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      status: apiStatus || undefined,
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  return {
    ...paginated,
    data: paginated.data.map((item: any) => ({
      id: String(item.id),
      userId: String(item.user_id ?? ''),
      orderId: String(item.order_id ?? ''),
      orderNo: item.order_no ?? undefined,
      category: item.category ?? item.type ?? '',
      subject: item.subject ?? item.reason ?? '',
      reason: item.reason ?? undefined,
      description: item.description ?? '',
      status: AFTER_SALE_STATUS_FROM_API[item.status] ?? item.status ?? 'pending',
      createdAt: item.created_at ?? '',
      updatedAt: item.updated_at ?? '',
      replacementOrderId: item.replacement_order_id ? String(item.replacement_order_id) : undefined,
      replacementOrderNo: item.replacement_order_no ?? undefined,
      replacementOrderStatus: item.replacement_order_status ?? undefined,
    })),
  };
}

export async function reviewAfterSales(
  id: string,
  action: 'approve' | 'reject',
  adminNote?: string,
): Promise<void> {
  await api.post(`/after-sales/${id}/review`, {
    action,
    admin_note: adminNote || undefined,
  });
}

export async function updateAfterSalesStatus(id: string, status: string): Promise<void> {
  const apiStatus = AFTER_SALE_STATUS_TO_API[status] ?? status;
  await api.patch(`/after-sales/${id}/status`, { status: apiStatus });
}

// ---------------------------------------------------------------------------
// Clothing Intakes
// ---------------------------------------------------------------------------

export async function fetchClothingIntakes(params: FilterParams = {}): Promise<PaginatedResponse<ClothingDonationItem>> {
  const { data: envelope } = await api.get('/clothing-intakes', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      status: params.status || undefined,
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  return {
    ...paginated,
    data: paginated.data.map((item: any) => ({
      id: String(item.id),
      garmentTypes: item.garment_types ?? '',
      quantityEstimate: item.quantity_estimate ?? null,
      pickupAddress: item.pickup_address ?? '',
      contactPhone: item.contact_phone ?? '',
      conditionNotes: item.condition_notes ?? '',
      status: item.status ?? 'pending',
      createdAt: item.created_at ?? '',
    })),
  };
}

export async function updateClothingIntakeStatus(id: string, status: string): Promise<void> {
  await api.patch(`/clothing-intakes/${id}`, { status });
}

// ---------------------------------------------------------------------------
// System Settings
// ---------------------------------------------------------------------------

export async function fetchSystemSettings(): Promise<SystemSettings> {
  const { data: envelope } = await api.get('/admin/settings');
  const d = envelope.data;
  return {
    siteName: d.site_name ?? '',
    siteDescription: d.site_tagline ?? '',
    contactEmail: d.contact_email ?? '',
    donationEnabled: d.donation_enabled ?? true,
    shopEnabled: d.shop_enabled ?? true,
    registrationEnabled: d.registration_enabled ?? true,
    maintenanceMode: d.maintenance_mode ?? false,
    paymentMethods: {
      wechat: { enabled: d.payment_methods?.wechat?.enabled ?? false, appId: d.payment_methods?.wechat?.appId, merchantId: d.payment_methods?.wechat?.merchantId },
      alipay: { enabled: d.payment_methods?.alipay?.enabled ?? false, appId: d.payment_methods?.alipay?.appId },
      stripe: { enabled: d.payment_methods?.stripe?.enabled ?? false, publicKey: d.payment_methods?.stripe?.publicKey },
      paypal: { enabled: d.payment_methods?.paypal?.enabled ?? false, clientId: d.payment_methods?.paypal?.clientId },
    },
    accessTokenTtlMinutes: d.access_token_ttl_minutes ?? 15,
    refreshTokenTtlDays: d.refresh_token_ttl_days ?? 7,
    globalRateLimit: d.global_rate_limit ?? 1000,
    perUserRateLimit: d.per_user_rate_limit ?? 60,
  };
}

export async function updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
  const body: Record<string, any> = {};
  if (data.siteName !== undefined) body.site_name = data.siteName;
  if (data.siteDescription !== undefined) body.site_tagline = data.siteDescription;
  if (data.contactEmail !== undefined) body.contact_email = data.contactEmail;
  if (data.donationEnabled !== undefined) body.donation_enabled = data.donationEnabled;
  if (data.shopEnabled !== undefined) body.shop_enabled = data.shopEnabled;
  if (data.registrationEnabled !== undefined) body.registration_enabled = data.registrationEnabled;
  if (data.maintenanceMode !== undefined) body.maintenance_mode = data.maintenanceMode;
  if (data.paymentMethods !== undefined) {
    body.payment_methods = {};
    for (const [k, v] of Object.entries(data.paymentMethods)) {
      body.payment_methods[k] = { enabled: v.enabled, appId: (v as any).appId, merchantId: (v as any).merchantId, publicKey: (v as any).publicKey, clientId: (v as any).clientId };
    }
  }
  if (data.accessTokenTtlMinutes !== undefined) body.access_token_ttl_minutes = data.accessTokenTtlMinutes;
  if (data.refreshTokenTtlDays !== undefined) body.refresh_token_ttl_days = data.refreshTokenTtlDays;
  if (data.globalRateLimit !== undefined) body.global_rate_limit = data.globalRateLimit;
  if (data.perUserRateLimit !== undefined) body.per_user_rate_limit = data.perUserRateLimit;
  const { data: envelope } = await api.put('/admin/settings', body);
  const d = envelope.data;
  return {
    siteName: d.site_name ?? '',
    siteDescription: d.site_tagline ?? '',
    contactEmail: d.contact_email ?? '',
    donationEnabled: d.donation_enabled ?? true,
    shopEnabled: d.shop_enabled ?? true,
    registrationEnabled: d.registration_enabled ?? true,
    maintenanceMode: d.maintenance_mode ?? false,
    paymentMethods: {
      wechat: { enabled: d.payment_methods?.wechat?.enabled ?? false, appId: d.payment_methods?.wechat?.appId, merchantId: d.payment_methods?.wechat?.merchantId },
      alipay: { enabled: d.payment_methods?.alipay?.enabled ?? false, appId: d.payment_methods?.alipay?.appId },
      stripe: { enabled: d.payment_methods?.stripe?.enabled ?? false, publicKey: d.payment_methods?.stripe?.publicKey },
      paypal: { enabled: d.payment_methods?.paypal?.enabled ?? false, clientId: d.payment_methods?.paypal?.clientId },
    },
    accessTokenTtlMinutes: d.access_token_ttl_minutes ?? 15,
    refreshTokenTtlDays: d.refresh_token_ttl_days ?? 7,
    globalRateLimit: d.global_rate_limit ?? 1000,
    perUserRateLimit: d.per_user_rate_limit ?? 60,
  };
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const { data: envelope } = await api.get('/system/health');
  return {
    status: envelope.status ?? 'unhealthy',
    backend: envelope.backend ?? { status: 'degraded', service: 'FastAPI', runtime: 'Uvicorn', version: envelope.version ?? '1.0.0', environment: envelope.environment ?? 'development', uptimeSeconds: 0, responseTimeMs: 0 },
    database: envelope.database ?? { status: 'error', engine: 'MySQL', version: null, latencyMs: null, checkedQuery: 'SELECT 1' },
    redis: envelope.redis ?? { status: 'error', version: null, latencyMs: null, purpose: 'cache / rate limiting' },
    deployment: envelope.deployment ?? { mode: 'Docker Compose', apiDocs: '/docs', publicHealth: '/health', adminHealth: '/api/v1/system/health' },
    checks: envelope.checks ?? [],
    version: envelope.version ?? '1.0.0',
    environment: envelope.environment ?? 'development',
    uptime: envelope.uptime ?? '0m',
    uptimeSeconds: envelope.uptimeSeconds ?? 0,
    checkedAt: envelope.checkedAt ?? new Date().toISOString(),
  };
}

export async function analyzeArtwork(imageUrl: string, description?: string): Promise<any> {
  const { data: envelope } = await api.post('/ai/analyze-artwork', {
    image_url: imageUrl,
    description: description ?? '',
  });
  return envelope.data;
}

export { api };
