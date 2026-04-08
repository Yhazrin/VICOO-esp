import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import type {
  Artwork, Campaign, Donation, Order, User,
  ChildParticipant, AuditLogEntry, DashboardMetrics,
  ChartDataPoint, SystemSettings, FilterParams, PaginatedResponse,
} from '../types';

// TODO: The following mock imports are still needed for functions not yet migrated.
// Remove them as each function is migrated to real HTTP requests.
import {
  mockCampaigns, mockDonations, mockUsers,
  mockChildParticipants,
  mockSystemSettings, mockAfterSales
} from './mockData';

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

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

// ---------------------------------------------------------------------------
// Helper: paginate mock array  (still used by unmigrated mock functions)
// ---------------------------------------------------------------------------
function paginate<T>(items: T[], params: FilterParams): PaginatedResponse<T> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  let filtered = [...items];

  if (params.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter((item) => JSON.stringify(item).toLowerCase().includes(s));
  }
  if (params.status) {
    filtered = filtered.filter((item: any) => item.status === params.status);
  }
  if (params.sortBy) {
    filtered.sort((a: any, b: any) => {
      const av = a[params.sortBy!];
      const bv = b[params.sortBy!];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return params.sortOrder === 'desc' ? -cmp : cmp;
    });
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize, totalPages };
}

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
      sort_by: params.sortBy || undefined,
      order: params.sortOrder || undefined,
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
 * Fetch orders from GET /orders (business route, no /admin prefix).
 */
export async function fetchOrders(params: FilterParams = {}): Promise<PaginatedResponse<Order>> {
  const { data: envelope } = await api.get('/orders', {
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
      orderNo: item.order_no ?? '',
      userId: String(item.user_id ?? ''),
      userName: item.user_name ?? '',
      items: (item.items ?? []).map((it: any) => ({
        productId: String(it.product_id ?? ''),
        productName: it.product_name ?? '',
        quantity: it.quantity ?? 0,
        price: parseFloat(it.price ?? '0') || 0,
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
// Unmigrated mock functions – TODO: migrate to real HTTP requests
// ---------------------------------------------------------------------------
const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

export async function fetchCampaigns(params: FilterParams = {}): Promise<PaginatedResponse<Campaign>> {
  // TODO: migrate to real endpoint
  await delay(300);
  return paginate(mockCampaigns, params);
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  // TODO: migrate to real endpoint
  await delay(300);
  const newCampaign: Campaign = {
    id: `camp-${mockCampaigns.length + 1}`,
    title: data.title || '',
    description: data.description || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    status: 'draft',
    targetAmount: data.targetAmount || 0,
    raisedAmount: 0,
    participantCount: 0,
    artworkCount: 0,
    createdAt: new Date().toISOString(),
  };
  mockCampaigns.push(newCampaign);
  return newCampaign;
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  // TODO: migrate to real endpoint
  await delay(200);
  const idx = mockCampaigns.findIndex((c) => c.id === id);
  if (idx >= 0) {
    mockCampaigns[idx] = { ...mockCampaigns[idx], ...data };
    return mockCampaigns[idx];
  }
  throw new Error('Campaign not found');
}

export async function fetchDonations(params: FilterParams = {}): Promise<PaginatedResponse<Donation>> {
  // TODO: migrate to real endpoint
  await delay(300);
  return paginate(mockDonations, params);
}

export async function fetchUsers(params: FilterParams = {}): Promise<PaginatedResponse<User>> {
  // TODO: migrate to real endpoint
  await delay(300);
  return paginate(mockUsers, params);
}

export async function updateUserRole(id: string, role: User['role']): Promise<User> {
  // TODO: migrate to real endpoint
  await delay(200);
  const user = mockUsers.find((u) => u.id === id);
  if (user) user.role = role;
  return { ...user! };
}

export async function updateUserStatus(id: string, status: User['status']): Promise<User> {
  // TODO: migrate to real endpoint
  await delay(200);
  const user = mockUsers.find((u) => u.id === id);
  if (user) user.status = status;
  return { ...user! };
}

export async function fetchChildParticipants(params: FilterParams = {}): Promise<PaginatedResponse<ChildParticipant>> {
  // TODO: migrate to real endpoint
  await delay(300);
  return paginate(mockChildParticipants, params);
}

export async function fetchAfterSales(params: FilterParams = {}): Promise<PaginatedResponse<any>> {
  // TODO: migrate to real endpoint
  await delay(300);
  return paginate(mockAfterSales, params);
}

export async function fetchSystemSettings(): Promise<SystemSettings> {
  // TODO: migrate to real endpoint
  await delay(200);
  return { ...mockSystemSettings };
}

export async function updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
  // TODO: migrate to real endpoint
  await delay(300);
  Object.assign(mockSystemSettings, data);
  return { ...mockSystemSettings };
}

export async function analyzeArtwork(imageUrl: string, description?: string): Promise<any> {
  // TODO: migrate to real endpoint
  await delay(1000);
  return {
    suggested_title: "璀璨的童心",
    suggested_tags: ["自然", "明亮", "莫兰迪色系", "装饰性"],
    style_description: "这件作品展现了极强的色彩控制力，低饱和度的色调呈现出宁静而充满希望的氛围，符合平台的'编辑出版物'美学。",
    safety_rating: "safe",
    moderation_notes: "内容完全合规，适合公开展示。"
  };
}

export { api };
