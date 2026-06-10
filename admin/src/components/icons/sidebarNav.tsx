import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Layers,
  Activity,
  Heart,
  ShoppingBag,
  Shirt,
  MessageSquare,
  Users,
  Package,
  FileText,
  Settings,
} from 'lucide-react';
import { ICON_STROKE } from './supplyChain';

export const SIDEBAR_NAV_ICONS: Record<string, LucideIcon> = {
  '/': LayoutDashboard,
  '/artworks': Layers,
  '/campaigns': Activity,
  '/donations': Heart,
  '/orders': ShoppingBag,
  '/clothing-donations': Shirt,
  '/after-sales': MessageSquare,
  '/users': Users,
  '/products': Package,
  '/audit-log': FileText,
  '/settings': Settings,
};

export function SidebarNavIcon({ path }: { path: string }) {
  const Icon = SIDEBAR_NAV_ICONS[path] ?? Package;
  return <Icon size={16} strokeWidth={ICON_STROKE} aria-hidden />;
}
