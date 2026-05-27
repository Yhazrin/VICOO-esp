/**
 * Unified Route Configuration
 *
 * Single source of truth for all routes in the admin panel.
 * All routes use /admin prefix.
 * Used by Sidebar, TopBar, and any navigation components.
 */

import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  Activity,
  Heart,
  Shirt,
  Layers,
  MessageSquare,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react';

import { ICON_STROKE } from '../components/icons/supplyChain';

export interface NavItem {
  path: string;
  labelKey: string; // i18n translation key
  icon: LucideIcon;
  group: 'main' | 'management' | 'system';
}

// All admin routes use /admin prefix
export const ROUTES: NavItem[] = [
  // Main - Dashboard
  { path: '/admin', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, group: 'main' },

  // Management
  { path: '/admin/users', labelKey: 'sidebar.users', icon: Users, group: 'management' },
  { path: '/admin/products', labelKey: 'sidebar.products', icon: Package, group: 'management' },
  { path: '/admin/orders', labelKey: 'sidebar.orders', icon: ShoppingBag, group: 'management' },
  { path: '/admin/campaigns', labelKey: 'sidebar.campaigns', icon: Activity, group: 'management' },
  { path: '/admin/donations', labelKey: 'sidebar.donations', icon: Heart, group: 'management' },
  { path: '/admin/clothing-donations', labelKey: 'sidebar.clothing', icon: Shirt, group: 'management' },
  { path: '/admin/artworks', labelKey: 'sidebar.artworks', icon: Layers, group: 'management' },
  { path: '/admin/after-sales', labelKey: 'sidebar.afterSales', icon: MessageSquare, group: 'management' },

  // System
  { path: '/admin/audit-log', labelKey: 'sidebar.auditLog', icon: FileText, group: 'system' },
  { path: '/admin/settings', labelKey: 'sidebar.settings', icon: Settings, group: 'system' },
];

// Group navigation items by their group
export const NAV_GROUPS = {
  main: ROUTES.filter((r) => r.group === 'main'),
  management: ROUTES.filter((r) => r.group === 'management'),
  system: ROUTES.filter((r) => r.group === 'system'),
};

// Map path to route config for quick lookup
export const ROUTE_MAP: Record<string, NavItem> = ROUTES.reduce(
  (acc, route) => {
    acc[route.path] = route;
    return acc;
  },
  {} as Record<string, NavItem>
);

// Dashboard action paths (for internal links in Dashboard)
export const DASHBOARD_ACTIONS = {
  artworks: '/admin/artworks',
  users: '/admin/users',
  products: '/admin/products',
  orders: '/admin/orders',
  campaigns: '/admin/campaigns',
  donations: '/admin/donations',
  clothingDonations: '/admin/clothing-donations',
  afterSales: '/admin/after-sales',
  auditLog: '/admin/audit-log',
} as const;

export type DashboardActionKey = keyof typeof DASHBOARD_ACTIONS;

/**
 * Get icon component for a given path with proper stroke width
 */
export function getRouteIcon(path: string): LucideIcon {
  const route = ROUTE_MAP[path];
  return route?.icon ?? Package;
}

// i18n group labels
export const GROUP_LABELS = {
  main: 'navigation.main',
  management: 'navigation.management',
  system: 'navigation.system',
} as const;
