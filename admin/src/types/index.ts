export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'admin' | 'editor' | 'viewer' | 'auditor';
  status: 'active' | 'disabled' | 'pending';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  childName: string;
  childAge: number;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  category: string;
  campaignId?: string;
  votes: number;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'ended' | 'archived';
  targetAmount: number;
  raisedAmount: number;
  participantCount: number;
  artworkCount: number;
  coverImage?: string;
  createdAt: string;
}

export interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  paymentMethod: 'wechat' | 'alipay' | 'stripe' | 'paypal';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  campaignId?: string;
  campaignTitle?: string;
  message?: string;
  isAnonymous: boolean;
  transactionId: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: string;
  shippingAddress: string;
  trackingNo?: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface ChildParticipant {
  id: string;
  childName: string;
  age: number;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  consentGiven: boolean;
  consentDate: string;
  region: string;
  school?: string;
  artworkCount: number;
  status: 'active' | 'withdrawn' | 'pending_review';
  createdAt: string;
  lastActivity?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalArtworks: number;
  pendingArtworks: number;
  totalDonations: number;
  totalDonationAmount: number;
  totalOrders: number;
  totalUsers: number;
  activeCampaigns: number;
  childParticipants: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  donationEnabled: boolean;
  shopEnabled: boolean;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  paymentMethods: {
    wechat: { enabled: boolean; appId?: string; merchantId?: string };
    alipay: { enabled: boolean; appId?: string };
    stripe: { enabled: boolean; publicKey?: string };
    paypal: { enabled: boolean; clientId?: string };
  };
}
