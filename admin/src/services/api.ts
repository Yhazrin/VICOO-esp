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
  mockUserGrowth, mockSystemSettings, mockAfterSales
} from './mockData';

const api = axios.create({
  baseURL: '/api/admin',
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

export async function fetchDashboardMetrics(): Promise[DashboardMetrics] {
  await delay(200);
  return { ...mockDashboardMetrics };
}

export async function fetchDonationTrend(): Promise<ChartDataPoint[]> {
  await delay(200);
  return [...mockDonationTrend];
}

export async function fetchArtworkByCategory(): Promise<ChartDataPoint[]> {
  await delay(200);
  return [...mockArtworkByCategory];
}

export async function fetchOrderTrend(): Promise<ChartDataPoint[]> {
  await delay(200);
  return [...mockOrderTrend];
}

export async function fetchUserGrowth(): Promise<ChartDataPoint[]> {
  await delay(200);
  return [...mockUserGrowth];
}

export async function fetchArtworks(params: FilterParams = {}): Promise<PaginatedResponse<Artwork>> {
  await delay(300);
  return paginate(mockArtworks, params);
}

export async function updateArtworkStatus(id: string, status: Artwork['status']): Promise<Artwork> {
  await delay(200);
  const art = mockArtworks.find((a) => a.id === id);
  if (art) {
    art.status = status;
    art.reviewedAt = new Date().toISOString();
    art.reviewedBy = '管理员';
  }
  return { ...art! };
}

export async function fetchCampaigns(params: FilterParams = {}): Promise<PaginatedResponse<Campaign>> {
  await delay(300);
  return paginate(mockCampaigns, params);
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
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
  await delay(200);
  const idx = mockCampaigns.findIndex((c) => c.id === id);
  if (idx >= 0) {
    mockCampaigns[idx] = { ...mockCampaigns[idx], ...data };
    return mockCampaigns[idx];
  }
  throw new Error('Campaign not found');
}

export async function fetchDonations(params: FilterParams = {}): Promise<PaginatedResponse<Donation>> {
  await delay(300);
  return paginate(mockDonations, params);
}

export async function fetchOrders(params: FilterParams = {}): Promise<PaginatedResponse<Order>> {
  await delay(300);
  return paginate(mockOrders, params);
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
  await delay(200);
  const order = mockOrders.find((o) => o.id === id);
  if (order) {
    order.status = status;
    if (status === 'shipped') order.shippedAt = new Date().toISOString();
  }
  return { ...order! };
}

export async function fetchUsers(params: FilterParams = {}): Promise<PaginatedResponse<User>> {
  await delay(300);
  return paginate(mockUsers, params);
}

export async function updateUserRole(id: string, role: User['role']): Promise<User> {
  await delay(200);
  const user = mockUsers.find((u) => u.id === id);
  if (user) user.role = role;
  return { ...user! };
}

export async function updateUserStatus(id: string, status: User['status']): Promise<User> {
  await delay(200);
  const user = mockUsers.find((u) => u.id === id);
  if (user) user.status = status;
  return { ...user! };
}

export async function fetchChildParticipants(params: FilterParams = {}): Promise<PaginatedResponse<ChildParticipant>> {
  await delay(300);
  return paginate(mockChildParticipants, params);
}

export async function fetchAuditLogs(params: FilterParams = {}): Promise<PaginatedResponse<AuditLogEntry>> {
  await delay(300);
  return paginate(mockAuditLogs, params);
}

export async function fetchAfterSales(params: FilterParams = {}): Promise<PaginatedResponse<any>> {
  await delay(300);
  return paginate(mockAfterSales, params);
}

export async function fetchSystemSettings(): Promise<SystemSettings> {
  await delay(200);
  return { ...mockSystemSettings };
}

export async function updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
  await delay(300);
  Object.assign(mockSystemSettings, data);
  return { ...mockSystemSettings };
}

export async function analyzeArtwork(imageUrl: string, description?: string): Promise<any> {
  await delay(1000);
  return {
    suggested_title: "璀璨的童心",
    suggested_tags: ["自然", "明亮", "莫兰迪色系", "装饰性"],
    style_description: "这件作品展现了极强的色彩控制力，低饱和度的色调呈现出宁静而充满希望的氛围，符合平台的‘编辑出版物’美学。",
    safety_rating: "safe",
    moderation_notes: "内容完全合规，适合公开展示。"
  };
}

export { api };
