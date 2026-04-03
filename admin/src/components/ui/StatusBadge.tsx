import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const statusStyles: Record<string, { bg: string; color: string; key: string }> = {
  pending: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', key: 'statusBadge.artwork.pending' },
  approved: { bg: 'var(--color-success-light)', color: 'var(--color-success)', key: 'statusBadge.artwork.approved' },
  rejected: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', key: 'statusBadge.artwork.rejected' },
  archived: { bg: 'var(--color-info-light)', color: 'var(--color-info)', key: 'statusBadge.artwork.archived' },
  draft: { bg: 'var(--color-accent-light)', color: 'var(--color-accent)', key: 'statusBadge.campaign.draft' },
  active: { bg: 'var(--color-success-light)', color: 'var(--color-success)', key: 'statusBadge.campaign.active' },
  ended: { bg: 'var(--color-warm-gray)', color: 'var(--color-sepia-mid)', key: 'statusBadge.campaign.ended' },
  paid: { bg: 'var(--color-info-light)', color: 'var(--color-info)', key: 'statusBadge.order.paid' },
  shipped: { bg: 'var(--color-accent-light)', color: 'var(--color-accent)', key: 'statusBadge.order.shipped' },
  delivered: { bg: 'var(--color-success-light)', color: 'var(--color-success)', key: 'statusBadge.order.delivered' },
  cancelled: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', key: 'statusBadge.order.cancelled' },
  refunded: { bg: 'var(--color-warm-gray)', color: 'var(--color-sepia-mid)', key: 'statusBadge.order.refunded' },
  completed: { bg: 'var(--color-success-light)', color: 'var(--color-success)', key: 'statusBadge.general.completed' },
  failed: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', key: 'statusBadge.general.failed' },
  active_user: { bg: 'var(--color-success-light)', color: 'var(--color-success)', key: 'statusBadge.user.active_user' },
  disabled: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', key: 'statusBadge.user.disabled' },
  withdrawn: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', key: 'statusBadge.afterSales.withdrawn' },
  pending_review: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', key: 'statusBadge.afterSales.pending_review' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const { t } = useTranslation();
  const style = statusStyles[status] || { bg: 'var(--color-accent-light)', color: 'var(--color-accent)', key: '' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: '2px',
      fontSize: '11px',
      fontWeight: 700,
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      border: `1px solid ${style.color}20`
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: style.color,
        marginRight: '8px',
        display: 'inline-block'
      }} />
      {label || (style.key ? t(style.key) : status)}
    </span>
  );
}
