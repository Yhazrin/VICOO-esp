// ─────────────────────────────────────────────────────────────
// Tonghua Public Welfare × Sustainable Fashion — Type Definitions
// ─────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  nickname: string;
  avatarUrl?: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt?: string;
}

export interface ChildParticipant {
  id: number;
  firstName: string;
  age: number;
  guardianId: number;
  schoolName?: string;
  consentGiven: boolean;
  consentDate?: string;
}

export interface Artwork {
  id: number;
  title: string;
  description: string;
  image_url: string;
  childParticipant: ChildParticipant;
  campaign_id?: number;
  status: 'pending' | 'approved' | 'featured' | 'rejected';
  vote_count: number;
  created_at: string;
  tags: string[];
}

export interface Campaign {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  artworkCount: number;
  participantCount: number;
  goalAmount: number;
  raisedAmount: number;
  featured: boolean;
  featuredChild?: {
    name: string;
    age: number;
    quote: string;
  };
}

export interface Story {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  author: string;
  publishedAt: string;
  readTimeMinutes: number;
  category: 'impact' | 'fashion' | 'community' | 'education';
}

export interface ProductArtworkAttribution {
  childName: string;
  age: number;
  campaign: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string | null;
  category: 'apparel' | 'accessories' | 'stationery' | 'prints';
  inStock: boolean;
  stockCount: number;
  artworkSource?: Artwork;
  artworkBy?: ProductArtworkAttribution;
  supplyChain: SupplyChainTimelineRecord[];
  /** Sustainability score (0-100) based on GOTS/SA8000/LCA audits. See /sustainability-methodology for scoring details. */
  sustainabilityScore: number;
}

/** Frontend display type for TraceabilityTimeline — not a direct API response type */
export interface SupplyChainTimelineRecord {
  id: number;
  stage: string;
  description: string;
  location: string;
  date: string;
  verified: boolean;
  partnerName: string;
  carbonFootprint?: number;
}

export interface SupplyChainRecord extends SupplyChainTimelineRecord {}

export interface DonationTier {
  id: number;
  amount: number;
  label: string;
  description: string;
  impactStatement: string;
}

export interface Donation {
  id: number;
  donor_user_id?: number;
  amount: number;
  currency: string;
  tierId?: number;
  campaignId?: number;
  message?: string;
  is_anonymous: boolean;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  transactionId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

/** @deprecated 请使用 services/orders 的 OrderDetail（与 API 字段一致） */
export interface Order {
  id: number;
  user_id: number;
  items: CartItem[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address?: string;
  createdAt: string;
  paidAt?: string;
}

export interface Address {
  name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Payment {
  id: string;
  orderId?: string;
  donationId?: string;
  amount: number;
  method: 'wechat' | 'alipay' | 'stripe' | 'paypal';
  providerTransactionId?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  createdAt: string;
}

export type Locale = 'en' | 'zh';

// ─── Service Request / Response Types ───

export interface SupplyChainTrace {
  product_id: number;
  product_name: string;
  records: SupplyChainTimelineRecord[];
}

export interface SupplyChainStage {
  key: string;
  label: string;
  order: number;
}

export interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface CreateDonationRequest {
  donor_name: string;
  amount: number;
  currency: string;
  payment_method: 'wechat' | 'alipay' | 'stripe' | 'paypal';
  campaign_id?: number;
  message?: string;
  is_anonymous: boolean;
}

export interface CreateOrderRequest {
  items: { product_id: number; quantity: number }[];
  shipping_address?: string;
  payment_method?: 'wechat' | 'alipay' | 'stripe' | 'paypal';
}

export interface CreatePaymentRequest {
  order_id?: number;
  donation_id?: number;
  amount: number;
  method: 'wechat' | 'alipay' | 'stripe' | 'paypal';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}
