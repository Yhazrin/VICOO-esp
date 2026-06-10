import { useTranslation } from 'react-i18next';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: string;
  label?: string;
  context?: 'artwork' | 'order' | 'donation' | 'campaign' | 'afterSales' | 'product' | 'user';
}

const STATUS_TYPE_MAP: Record<string, string> = {
  // Pending
  pending: 'warning',
  order_pending: 'warning',
  donation_pending: 'warning',
  campaign_pending: 'warning',

  // Approved / Active / Success
  approved: 'success',
  active: 'success',
  delivered: 'success',
  completed: 'success',
  received: 'success',
  converted: 'success',
  active_user: 'success',

  // Error / Rejected
  rejected: 'error',
  cancelled: 'error',
  failed: 'error',
  banned: 'error',
  disabled: 'error',
  withdrawn: 'error',
  sold_out: 'error',

  // Draft / Inactive
  archived: 'neutral',
  draft: 'neutral',
  ended: 'neutral',
  refunded: 'neutral',
  inactive: 'neutral',
  shipped: 'neutral',
  paid: 'neutral',

  // Info / Processing
  processing: 'info',
};

export default function StatusBadge({ status, label, context }: StatusBadgeProps) {
  const { t } = useTranslation();

  const i18nKey = context
    ? `statusBadge.${context}.${status}`
    : `statusBadge.general.${status}`;

  // Get type for styling
  const type = STATUS_TYPE_MAP[status] || 'neutral';

  return (
    <span className={`status-badge status-badge--${type}`}>
      <span className="status-badge__dot" />
      {label || t(i18nKey, { defaultValue: status })}
    </span>
  );
}