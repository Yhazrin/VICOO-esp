import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import type {
  Artwork, Campaign, Donation, Order, User,
  ChildParticipant, AuditLogEntry, DashboardMetrics,
  ChartDataPoint, SystemSettings, FilterParams, PaginatedResponse,
} from '../types';
import {
  mockArtworks, mockCampaigns, mockDonations, mockOrders, mockUsers,
  mockChildParticipants, mockAuditLogs, mockDashboardMetrics,
  mockDonationTrend, mockArtworkByCategory, mockOrderTrend,
  mockUserGrowth, mockSystemSettings,
} from './mockData';

const api = axios.create({
  baseURL: '/api/admin',
  timeout: 10000,
  withCredentials: true, // Send httpOnly cookies with every request
  headers: { 'Content-Type': 'application/json' },
});
const coreApi = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
const USE_REAL_API = import.meta.env.VITE_ADMIN_USE_REAL_API !== 'false';

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);
coreApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

async function withFallback<T>(realCall: () => Promise<T>, mockCall: () => Promise<T> | T): Promise<T> {
  if (!USE_REAL_API) return await Promise.resolve(mockCall());
  try {
    return await realCall();
  } catch (error) {
    console.warn('[admin-api] real API failed, fallback to mock:', error);
    return await Promise.resolve(mockCall());
  }
}

function toPaginated<T>(payload: any, mapItem: (item: any) => T): PaginatedResponse<T> {
  const rawData = Array.isArray(payload?.data) ? payload.data : [];
  const pageSize = payload?.pageSize ?? payload?.page_size ?? 10;
  const total = payload?.total ?? rawData.length;
  return {
    data: rawData.map(mapItem),
    total,
    page: payload?.page ?? 1,
    pageSize,
    totalPages: payload?.totalPages ?? Math.max(1, Math.ceil(total / pageSize)),
  };
}

const toNum = (v: any, d = 0) => Number(v ?? d);

const mapArtwork = (a: any): Artwork => ({
  id: String(a.id),
  title: a.title ?? '',
  description: a.description ?? '',
  childName: a.childParticipant?.firstName ?? a.artist_name ?? '未知',
  childAge: Number(a.childParticipant?.age ?? 0),
  imageUrl: a.image_url ?? a.imageUrl ?? '',
  status: (a.status ?? 'pending') as Artwork['status'],
  category: a.category ?? 'general',
  campaignId: a.campaign_id != null ? String(a.campaign_id) : undefined,
  votes: toNum(a.vote_count ?? a.like_count),
  createdAt: a.created_at ?? new Date().toISOString(),
  reviewedAt: a.reviewed_at,
  reviewedBy: a.reviewed_by,
});

const mapCampaign = (c: any): Campaign => ({
  id: String(c.id),
  title: c.title ?? '',
  description: c.description ?? '',
  startDate: c.start_date ?? c.startDate ?? '',
  endDate: c.end_date ?? c.endDate ?? '',
  status: ((c.status === 'completed' ? 'ended' : c.status) ?? 'draft') as Campaign['status'],
  targetAmount: toNum(c.goal_amount ?? c.targetAmount),
  raisedAmount: toNum(c.current_amount ?? c.raised_amount ?? c.raisedAmount),
  participantCount: toNum(c.participant_count ?? c.participantCount),
  artworkCount: toNum(c.artwork_count ?? c.artworkCount),
  coverImage: c.cover_image ?? c.coverImage,
  createdAt: c.created_at ?? c.createdAt ?? new Date().toISOString(),
});

const mapDonation = (d: any): Donation => ({
  id: String(d.id),
  donorName: d.donor_name ?? d.donorName ?? '匿名',
  donorEmail: d.donor_email ?? d.donorEmail ?? '',
  amount: toNum(d.amount),
  currency: d.currency ?? 'CNY',
  paymentMethod: (d.payment_method ?? d.paymentMethod ?? 'wechat') as Donation['paymentMethod'],
  status: (d.status ?? 'pending') as Donation['status'],
  campaignId: d.campaign_id != null ? String(d.campaign_id) : undefined,
  campaignTitle: d.campaign_title ?? d.campaignTitle,
  message: d.message ?? undefined,
  isAnonymous: Boolean(d.is_anonymous ?? d.isAnonymous),
  transactionId: d.payment_id ?? d.transactionId ?? '',
  createdAt: d.created_at ?? d.createdAt ?? new Date().toISOString(),
});

const mapOrder = (o: any): Order => ({
  id: String(o.id),
  orderNo: o.order_no ?? o.orderNo ?? '',
  userId: String(o.user_id ?? o.userId ?? ''),
  userName: o.user_name ?? o.userName ?? '',
  items: Array.isArray(o.items) ? o.items.map((it: any) => ({
    productId: String(it.product_id ?? it.productId ?? ''),
    productName: it.product_name ?? it.productName ?? '',
    quantity: toNum(it.quantity),
    price: toNum(it.price),
    imageUrl: it.image_url ?? it.imageUrl,
  })) : [],
  totalAmount: toNum(o.total_amount ?? o.totalAmount),
  status: (o.status ?? 'pending') as Order['status'],
  paymentMethod: o.payment_method ?? o.paymentMethod ?? '',
  shippingAddress: o.shipping_address ?? o.shippingAddress ?? '',
  trackingNo: o.tracking_number ?? o.trackingNo,
  createdAt: o.created_at ?? o.createdAt ?? new Date().toISOString(),
  paidAt: o.paid_at ?? o.paidAt,
  shippedAt: o.shipped_at ?? o.shippedAt,
});

const mapUser = (u: any): User => ({
  id: String(u.id),
  username: u.nickname ?? u.username ?? u.email ?? '',
  email: u.email ?? '',
  phone: u.phone,
  role: (u.role ?? 'viewer') as User['role'],
  status: (u.status === 'banned' ? 'disabled' : (u.status ?? 'active')) as User['status'],
  avatar: u.avatar,
  createdAt: u.created_at ?? u.createdAt ?? new Date().toISOString(),
  lastLogin: u.last_login ?? u.lastLogin,
});

const mapChildParticipant = (p: any): ChildParticipant => ({
  id: String(p.id),
  childName: p.display_name ?? p.child_name ?? '',
  age: toNum(p.age),
  guardianName: p.guardian_name ?? '',
  guardianPhone: p.guardian_phone ?? '',
  guardianEmail: p.guardian_email ?? '',
  consentGiven: Boolean(p.consent_given ?? p.consentGiven),
  consentDate: p.consent_date ?? p.consentDate ?? '',
  region: p.region ?? '',
  school: p.school,
  artworkCount: toNum(p.artwork_count ?? p.artworkCount),
  status: (p.status ?? 'pending_review') as ChildParticipant['status'],
  createdAt: p.created_at ?? p.createdAt ?? new Date().toISOString(),
  lastActivity: p.last_activity ?? p.lastActivity,
});

const mapAuditLog = (l: any): AuditLogEntry => ({
  id: String(l.id),
  userId: String(l.user_id ?? l.userId ?? ''),
  userName: l.user_name ?? l.userName ?? '',
  action: l.action ?? '',
  resource: l.resource ?? '',
  resourceId: l.resource_id != null ? String(l.resource_id) : undefined,
  details: l.details ?? '',
  ipAddress: l.ip_address ?? l.ipAddress ?? '',
  userAgent: l.user_agent ?? l.userAgent ?? '',
  timestamp: l.timestamp ?? new Date().toISOString(),
});

// Helper: paginate mock array
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

// Delay helper to simulate network
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// === API Functions (using mock data for development) ===
// NOTE: Mock data is used for development and testing purposes.
// When backend is ready, replace mock calls with real API calls:
// Example: return api.get('/dashboard/metrics').then(r => r.data);

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return withFallback(async () => {
    const response = await api.get('/dashboard');
    const d = response.data?.data ?? {};
    return {
      totalArtworks: toNum(d.total_artworks),
      pendingArtworks: toNum(d.pending_artworks),
      totalDonations: toNum(d.total_donations),
      totalDonationAmount: toNum(d.total_donation_amount),
      totalOrders: toNum(d.total_orders),
      totalUsers: toNum(d.total_users),
      activeCampaigns: toNum(d.active_campaigns),
      childParticipants: toNum(d.total_child_participants ?? d.child_participants),
    };
  }, async () => {
    await delay(200);
    return { ...mockDashboardMetrics };
  });
}

export async function fetchDonationTrend(): Promise<ChartDataPoint[]> {
  return withFallback(async () => {
    const response = await api.get('/analytics/donations');
    const rows = response.data?.data?.by_method ?? [];
    return rows.map((r: any) => ({ name: r.method ?? 'unknown', value: toNum(r.total) }));
  }, async () => {
    await delay(200);
    return [...mockDonationTrend];
  });
}

export async function fetchArtworkByCategory(): Promise<ChartDataPoint[]> {
  return withFallback(async () => {
    const response = await api.get('/analytics/artworks');
    const byStatus = response.data?.data?.by_status ?? {};
    return Object.entries(byStatus).map(([name, value]) => ({ name, value: toNum(value) }));
  }, async () => {
    await delay(200);
    return [...mockArtworkByCategory];
  });
}

export async function fetchOrderTrend(): Promise<ChartDataPoint[]> {
  return withFallback(async () => {
    const response = await api.get('/analytics/orders');
    const byStatus = response.data?.data?.by_status ?? {};
    return Object.entries(byStatus).map(([name, value]) => ({ name, value: toNum(value) }));
  }, async () => {
    await delay(200);
    return [...mockOrderTrend];
  });
}

export async function fetchUserGrowth(): Promise<ChartDataPoint[]> {
  return withFallback(async () => {
    const response = await coreApi.get('/users', { params: { page: 1, page_size: 200 } });
    const items = Array.isArray(response.data?.data) ? response.data.data : [];
    const grouped: Record<string, number> = {};
    items.forEach((it: any) => {
      const dt = new Date(it.created_at ?? it.createdAt ?? Date.now());
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, value }));
  }, async () => {
    await delay(200);
    return [...mockUserGrowth];
  });
}

export async function fetchArtworks(params: FilterParams = {}): Promise<PaginatedResponse<Artwork>> {
  return withFallback(async () => {
    const response = await coreApi.get('/artworks', {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 10,
        status: params.status,
      },
    });
    return toPaginated(response.data, mapArtwork);
  }, async () => {
    await delay(300);
    return paginate(mockArtworks, params);
  });
}

export async function updateArtworkStatus(id: string, status: Artwork['status']): Promise<Artwork> {
  return withFallback(async () => {
    const response = await coreApi.put(`/artworks/${id}/status`, { status });
    return mapArtwork(response.data?.data ?? {});
  }, async () => {
    await delay(200);
    const art = mockArtworks.find((a) => a.id === id);
    if (art) {
      art.status = status;
      art.reviewedAt = new Date().toISOString();
      art.reviewedBy = '管理员';
    }
    return { ...art! };
  });
}

export async function fetchCampaigns(params: FilterParams = {}): Promise<PaginatedResponse<Campaign>> {
  return withFallback(async () => {
    const response = await coreApi.get('/campaigns', {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 10,
        status: params.status,
      },
    });
    return toPaginated(response.data, mapCampaign);
  }, async () => {
    await delay(300);
    return paginate(mockCampaigns, params);
  });
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  return withFallback(async () => {
    const response = await coreApi.post('/campaigns', {
      title: data.title || '',
      description: data.description || '',
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status === 'ended' ? 'completed' : (data.status || 'draft'),
      goal_amount: data.targetAmount ?? 0,
    });
    return mapCampaign(response.data?.data ?? {});
  }, async () => {
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
  });
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  return withFallback(async () => {
    const response = await coreApi.put(`/campaigns/${id}`, {
      title: data.title,
      description: data.description,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status === 'ended' ? 'completed' : data.status,
      goal_amount: data.targetAmount,
    });
    return mapCampaign(response.data?.data ?? {});
  }, async () => {
    await delay(200);
    const idx = mockCampaigns.findIndex((c) => c.id === id);
    if (idx >= 0) {
      mockCampaigns[idx] = { ...mockCampaigns[idx], ...data };
      return mockCampaigns[idx];
    }
    throw new Error('Campaign not found');
  });
}

export async function fetchDonations(params: FilterParams = {}): Promise<PaginatedResponse<Donation>> {
  return withFallback(async () => {
    const response = await coreApi.get('/donations', {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 10,
        status: params.status,
      },
    });
    return toPaginated(response.data, mapDonation);
  }, async () => {
    await delay(300);
    return paginate(mockDonations, params);
  });
}

export async function fetchOrders(params: FilterParams = {}): Promise<PaginatedResponse<Order>> {
  return withFallback(async () => {
    const response = await coreApi.get('/orders', {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 10,
        status: params.status,
      },
    });
    return toPaginated(response.data, mapOrder);
  }, async () => {
    await delay(300);
    return paginate(mockOrders, params);
  });
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
  return withFallback(async () => {
    const response = await coreApi.put(`/orders/${id}/status`, { status });
    return mapOrder(response.data?.data ?? {});
  }, async () => {
    await delay(200);
    const order = mockOrders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      if (status === 'shipped') order.shippedAt = new Date().toISOString();
    }
    return { ...order! };
  });
}

export async function fetchUsers(params: FilterParams = {}): Promise<PaginatedResponse<User>> {
  return withFallback(async () => {
    const response = await coreApi.get('/users', {
      params: { page: params.page ?? 1, page_size: params.pageSize ?? 10 },
    });
    return toPaginated(response.data, mapUser);
  }, async () => {
    await delay(300);
    return paginate(mockUsers, params);
  });
}

export async function updateUserRole(id: string, role: User['role']): Promise<User> {
  return withFallback(async () => {
    const response = await coreApi.put(`/users/${id}/role`, { role });
    return mapUser(response.data?.data ?? {});
  }, async () => {
    await delay(200);
    const user = mockUsers.find((u) => u.id === id);
    if (user) user.role = role;
    return { ...user! };
  });
}

export async function updateUserStatus(id: string, status: User['status']): Promise<User> {
  return withFallback(async () => {
    const backendStatus = status === 'disabled' ? 'banned' : status;
    const response = await coreApi.put(`/users/${id}/status`, { status: backendStatus });
    return mapUser(response.data?.data ?? {});
  }, async () => {
    await delay(200);
    const user = mockUsers.find((u) => u.id === id);
    if (user) user.status = status;
    return { ...user! };
  });
}

export async function fetchChildParticipants(params: FilterParams = {}): Promise<PaginatedResponse<ChildParticipant>> {
  return withFallback(async () => {
    const response = await api.get('/child-participants', {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 10,
        status: params.status,
      },
    });
    return toPaginated(response.data, mapChildParticipant);
  }, async () => {
    await delay(300);
    return paginate(mockChildParticipants, params);
  });
}

export async function fetchAuditLogs(params: FilterParams = {}): Promise<PaginatedResponse<AuditLogEntry>> {
  return withFallback(async () => {
    const response = await api.get('/audit-logs', {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 10,
      },
    });
    return toPaginated(response.data, mapAuditLog);
  }, async () => paginate(mockAuditLogs, params));
}

export async function fetchSystemSettings(): Promise<SystemSettings> {
  return withFallback<SystemSettings>(async () => {
    const response = await api.get('/settings');
    const s = response.data?.data ?? {};
    const pm = s.payment_methods ?? {};
    const normalized: SystemSettings = {
      siteName: s.site_name ?? mockSystemSettings.siteName,
      siteDescription: s.site_tagline ?? mockSystemSettings.siteDescription,
      contactEmail: s.contact_email ?? mockSystemSettings.contactEmail,
      donationEnabled: Boolean(s.donation_enabled ?? mockSystemSettings.donationEnabled),
      shopEnabled: Boolean(s.shop_enabled ?? mockSystemSettings.shopEnabled),
      registrationEnabled: Boolean(s.registration_enabled ?? mockSystemSettings.registrationEnabled),
      maintenanceMode: Boolean(s.maintenance_mode ?? mockSystemSettings.maintenanceMode),
      paymentMethods: {
        wechat: {
          enabled: Boolean(pm.wechat?.enabled ?? true),
          appId: pm.wechat?.appId,
          merchantId: pm.wechat?.merchantId,
        },
        alipay: {
          enabled: Boolean(pm.alipay?.enabled ?? true),
          appId: pm.alipay?.appId,
        },
        stripe: {
          enabled: Boolean(pm.stripe?.enabled ?? true),
          publicKey: pm.stripe?.publicKey,
        },
        paypal: {
          enabled: Boolean(pm.paypal?.enabled ?? true),
          clientId: pm.paypal?.clientId,
        },
      },
    };
    return normalized;
  }, async () => {
    await delay(200);
    return { ...mockSystemSettings } as SystemSettings;
  });
}

export async function updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
  return withFallback<SystemSettings>(async () => {
    const payload = {
      site_name: data.siteName,
      site_tagline: data.siteDescription,
      contact_email: data.contactEmail,
      donation_enabled: data.donationEnabled,
      shop_enabled: data.shopEnabled,
      registration_enabled: data.registrationEnabled,
      maintenance_mode: data.maintenanceMode,
      payment_methods: data.paymentMethods,
    };
    await api.put('/settings', payload);
    return { ...(await fetchSystemSettings()), ...data } as SystemSettings;
  }, async () => {
    await delay(300);
    Object.assign(mockSystemSettings, data);
    return { ...mockSystemSettings } as SystemSettings;
  });
}

export async function analyzeArtwork(imageUrl: string, description?: string): Promise<any> {
  return withFallback(async () => {
    const response = await coreApi.post('/ai/analyze-artwork', {
      image_url: imageUrl,
      description,
    });
    return response.data?.data;
  }, async () => {
    await delay(1000);
    return {
      suggested_title: "璀璨的童心",
      suggested_tags: ["自然", "明亮", "莫兰迪色系", "装饰性"],
      style_description: "这件作品展现了极强的色彩控制力，低饱和度的色调呈现出宁静而充满希望的氛围，符合平台的‘编辑出版物’美学。",
      safety_rating: "safe",
      moderation_notes: "内容完全合规，适合公开展示。"
    };
  });
}

export { api };
