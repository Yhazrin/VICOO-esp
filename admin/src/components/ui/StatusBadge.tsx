import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const statusStyles: Record<string, { bg: string; color: string; key: string }> = {
  pending: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', key: 'statusBadge.artwork.pending' },
  approved: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', key: 'statusBadge.artwork.approved' },
  rejected: { bg: 'var(--color-error-bg)', color: 'var(--color-error)', key: 'statusBadge.artwork.rejected' },
  archived: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', key: 'statusBadge.artwork.archived' },
  draft: { bg: 'rgba(255,255,255,0.06)', color: 'var(--color-text-2)', key: 'statusBadge.campaign.draft' },
  active: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', key: 'statusBadge.campaign.active' },
  ended: { bg: 'rgba(255,255,255,0.06)', color: 'var(--color-text-3)', key: 'statusBadge.campaign.ended' },
  paid: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', key: 'statusBadge.order.paid' },
  shipped: { bg: 'rgba(255,255,255,0.06)', color: 'var(--color-text-2)', key: 'statusBadge.order.shipped' },
  delivered: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', key: 'statusBadge.order.delivered' },
  cancelled: { bg: 'var(--color-error-bg)', color: 'var(--color-error)', key: 'statusBadge.order.cancelled' },
  refunded: { bg: 'rgba(255,255,255,0.06)', color: 'var(--color-text-3)', key: 'statusBadge.order.refunded' },
  completed: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', key: 'statusBadge.general.completed' },
  failed: { bg: 'var(--color-error-bg)', color: 'var(--color-error)', key: 'statusBadge.general.failed' },
  active_user: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', key: 'statusBadge.user.active_user' },
  /** 后端用户状态为 banned；管理 UI 沿用「已禁用」文案 */
  banned: { bg: 'var(--color-error-bg)', color: 'var(--color-error)', key: 'statusBadge.user.disabled' },
  disabled: { bg: 'var(--color-error-bg)', color: 'var(--color-error)', key: 'statusBadge.user.disabled' },
  withdrawn: { bg: 'var(--color-error-bg)', color: 'var(--color-error)', key: 'statusBadge.afterSales.withdrawn' },
  pending_review: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', key: 'statusBadge.afterSales.pending_review' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const { t } = useTranslation();
  const style = statusStyles[status] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--color-text-2)', key: '' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 500,
      fontFamily: 'var(--font-mono)',
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap',
      letterSpacing: '0.03em',
    }}>
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        backgroundColor: style.color,
        marginRight: '6px',
        display: 'inline-block',
      }} />
      {label || (style.key ? t(style.key) : status)}
    </span>
  );
}
