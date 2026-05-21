import type { ClothingIntake } from '@/services/clothingIntakes';

export type OrderStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'listed';

export interface RecycleOrder {
  id: string;
  date: string;
  type: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'listed';
  statusLabel: string;
  reason?: string;
  productLink?: string;
}

export const ORDER_STATUS_KEYS: Record<Exclude<OrderStatus, 'all'>, string> = {
  listed: 'donateClothing.statusLabels.listed',
  pending: 'donateClothing.statusLabels.pending',
  approved: 'donateClothing.statusLabels.approved',
  rejected: 'donateClothing.statusLabels.rejected',
};

export const STATUS_BADGE: Record<RecycleOrder['status'], string> = {
  listed: 'bg-sage/10 text-sage border border-sage/30',
  pending: 'bg-amber-50 text-amber-700 border border-amber-300',
  approved: 'bg-sky-50 text-sky-700 border border-sky-300',
  rejected: 'bg-red-50 text-red-700 border border-red-300',
};

export const TYPE_LABEL_KEYS: Record<string, string> = {
  tshirt: 'donateClothing.types.tshirt',
  pants: 'donateClothing.types.pants',
  jacket: 'donateClothing.types.jacket',
  skirt: 'donateClothing.types.skirt',
  other: 'donateClothing.types.other',
};

export const CONDITION_LABEL_KEYS: Record<string, string> = {
  new: 'donateClothing.conditions.new',
  'like-new': 'donateClothing.conditions.likeNew',
  good: 'donateClothing.conditions.good',
  fair: 'donateClothing.conditions.fair',
};

export const TYPE_OPTION_VALUES = ['tshirt', 'pants', 'jacket', 'skirt', 'other'] as const;
export const CONDITION_OPTION_VALUES = ['new', 'like-new', 'good', 'fair'] as const;

export const TAB_KEYS: Record<OrderStatus, string> = {
  all: 'donateClothing.tabs.all',
  pending: 'donateClothing.tabs.pending',
  approved: 'donateClothing.tabs.approved',
  rejected: 'donateClothing.tabs.rejected',
  listed: 'donateClothing.tabs.listed',
};

export const FLOW_STEP_KEYS = [
  'donateClothing.flowSteps.submit',
  'donateClothing.flowSteps.review',
  'donateClothing.flowSteps.sort',
  'donateClothing.flowSteps.list',
  'donateClothing.flowSteps.purchase',
  'donateClothing.flowSteps.closeLoop',
] as const;

export function mapIntakeStatus(status: string): RecycleOrder['status'] {
  if (status === 'approved' || status === 'rejected' || status === 'listed') return status;
  return 'pending';
}

export function formatOrderId(intake: ClothingIntake): string {
  return `RC-${intake.created_at.slice(0, 10).replace(/-/g, '')}-${String(intake.id).padStart(3, '0')}`;
}

export function mapIntakeToOrder(
  intake: ClothingIntake,
  orderStatusLabels: Record<Exclude<OrderStatus, 'all'>, string>,
): RecycleOrder {
  const status = mapIntakeStatus(intake.status);
  return {
    id: formatOrderId(intake),
    date: intake.created_at.slice(0, 10),
    type: intake.garment_types || intake.summary,
    quantity: intake.quantity_estimate || 1,
    status,
    statusLabel: orderStatusLabels[status],
    reason: intake.admin_note || undefined,
    productLink: intake.product_id ? `/shop/${intake.product_id}` : undefined,
  };
}
