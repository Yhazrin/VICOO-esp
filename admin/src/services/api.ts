import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import type {
  Artwork, Campaign, Donation, Order, User,
  ChildParticipant, AuditLogEntry, DashboardMetrics,
  ChartDataPoint, SystemSettings, FilterParams, PaginatedResponse,
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
// Campaigns
// ---------------------------------------------------------------------------

function adaptCampaign(item: any): Campaign {
  return {
    id: String(item.id),
    title: item.title ?? '',
    description: item.description ?? '',
    startDate: item.start_date ?? '',
    endDate: item.end_date ?? '',
    status: item.status ?? 'draft',
    targetAmount: parseFloat(item.goal_amount ?? '0') || 0,
    raisedAmount: parseFloat(item.current_amount ?? '0') || 0,
    participantCount: item.participant_count ?? 0,
    artworkCount: item.artwork_count ?? 0,
    coverImage: item.cover_image,
    createdAt: item.created_at ?? '',
  };
}

export async function fetchCampaigns(params: FilterParams = {}): Promise<PaginatedResponse<Campaign>> {
  const { data: envelope } = await api.get('/campaigns', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      status: params.status || undefined,
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  return { ...paginated, data: paginated.data.map(adaptCampaign) };
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  const { data: envelope } = await api.post('/campaigns', {
    title: data.title,
    description: data.description,
    start_date: data.startDate,
    end_date: data.endDate,
    goal_amount: data.targetAmount,
    cover_image: data.coverImage,
  });
  return adaptCampaign(envelope.data);
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  const body: Record<string, any> = {};
  if (data.title !== undefined) body.title = data.title;
  if (data.description !== undefined) body.description = data.description;
  if (data.startDate !== undefined) body.start_date = data.startDate;
  if (data.endDate !== undefined) body.end_date = data.endDate;
  if (data.status !== undefined) body.status = data.status;
  if (data.targetAmount !== undefined) body.goal_amount = data.targetAmount;
  if (data.coverImage !== undefined) body.cover_image = data.coverImage;
  const { data: envelope } = await api.put(`/campaigns/${id}`, body);
  return adaptCampaign(envelope.data);
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

export async function fetchDonations(params: FilterParams = {}): Promise<PaginatedResponse<Donation>> {
  const { data: envelope } = await api.get('/donations', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      status: params.status || undefined,
    },
  });
  const paginated = adaptPaginated<any>(envelope);
  return { ...paginated, data: paginated.data.map(adaptDonation) };
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
// Child Participants
// ---------------------------------------------------------------------------

export async function fetchChildParticipants(params: FilterParams = {}): Promise<PaginatedResponse<ChildParticipant>> {
  const { data: envelope } = await api.get('/admin/child-participants', {
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
      childName: item.child_name ?? '',
      age: item.age ?? 0,
      guardianName: item.guardian_name ?? '',
      guardianPhone: item.guardian_phone ?? '',
      guardianEmail: item.guardian_email ?? '',
      consentGiven: item.consent_given ?? false,
      consentDate: item.consent_date ?? '',
      region: item.region ?? '',
      school: item.school,
      artworkCount: item.artwork_count ?? 0,
      status: item.status ?? 'pending_review',
      createdAt: item.created_at ?? '',
      lastActivity: item.last_activity,
    })),
  };
}

// ---------------------------------------------------------------------------
// After-Sales
// ---------------------------------------------------------------------------

export async function fetchAfterSales(params: FilterParams = {}): Promise<PaginatedResponse<any>> {
  const { data: envelope } = await api.get('/after-sales', {
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
      userId: String(item.user_id ?? ''),
      orderId: String(item.order_id ?? ''),
      category: item.category ?? '',
      subject: item.subject ?? '',
      description: item.description ?? '',
      status: item.status ?? 'open',
      createdAt: item.created_at ?? '',
      updatedAt: item.updated_at ?? '',
    })),
  };
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
      body.payment_methods[k] = { enabled: v.enabled, appId: v.appId, merchantId: (v as any).merchantId, publicKey: (v as any).publicKey, clientId: (v as any).clientId };
    }
  }
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
