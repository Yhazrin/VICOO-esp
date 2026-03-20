// ─────────────────────────────────────────────────────────────
// Tonghua Public Welfare × Sustainable Fashion — Type Definitions
// ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
}

export interface ChildParticipant {
  id: string;
  firstName: string;
  age: number;
  guardianId: string;
  schoolName?: string;
  consentGiven: boolean;
  consentDate?: string;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  childParticipant: ChildParticipant;
  campaignId?: string;
  status: 'pending' | 'approved' | 'featured' | 'rejected';
  voteCount: number;
  createdAt: string;
  tags: string[];
}

export interface Campaign {
  id: string;
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
  id: string;
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
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrls: string[];
  category: 'apparel' | 'accessories' | 'stationery' | 'prints';
  inStock: boolean;
  stockCount: number;
  artworkSource?: Artwork;
  artworkBy?: ProductArtworkAttribution;
  supplyChain: SupplyChainRecord[];
  sustainabilityScore: number;
}

export interface SupplyChainRecord {
  id: string;
  stage: string;
  description: string;
  location: string;
  date: string;
  verified: boolean;
  partnerName: string;
  carbonFootprint?: number;
}

export interface DonationTier {
  id: string;
  amount: number;
  label: string;
  description: string;
  impactStatement: string;
}

export interface Donation {
  id: string;
  userId?: string;
  amount: number;
  currency: string;
  tierId?: string;
  campaignId?: string;
  message?: string;
  anonymous: boolean;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  transactionId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
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

export type Locale = 'en' | 'zh';
