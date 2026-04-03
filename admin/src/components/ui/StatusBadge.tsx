interface StatusBadgeProps {
  status: string;
  label?: string;
}

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  // Artwork
  pending: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', label: '待审核' },
  approved: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: '已通过' },
  rejected: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', label: '已拒绝' },
  archived: { bg: 'var(--color-info-light)', color: 'var(--color-info)', label: '已归档' },
  // Campaign
  draft: { bg: 'var(--color-accent-light)', color: 'var(--color-accent)', label: '草稿' },
  active: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: '进行中' },
  ended: { bg: 'var(--color-warm-gray)', color: 'var(--color-sepia-mid)', label: '已结束' },
  // Order
  paid: { bg: 'var(--color-info-light)', color: 'var(--color-info)', label: '已支付' },
  shipped: { bg: 'var(--color-accent-light)', color: 'var(--color-accent)', label: '已发货' },
  delivered: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: '已送达' },
  cancelled: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', label: '已取消' },
  refunded: { bg: 'var(--color-warm-gray)', color: 'var(--color-sepia-mid)', label: '已退款' },
  // Donation
  completed: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: '已完成' },
  failed: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', label: '失败' },
  // User
  active_user: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: '正常' },
  disabled: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', label: '已禁用' },
  // Child participant
  withdrawn: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', label: '已退出' },
  pending_review: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', label: '待审查' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status] || { bg: 'var(--color-accent-light)', color: 'var(--color-accent)', label: status };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: '2px', // Editorial square style
      fontSize: '11px',
      fontWeight: 700,
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      border: `1px solid ${style.color}20` // Subtle border using the color with alpha
    }}>
      <span style={{ 
        width: '6px', 
        height: '6px', 
        borderRadius: '50%', 
        backgroundColor: style.color,
        marginRight: '8px',
        display: 'inline-block'
      }} />
      {label || style.label}
    </span>
  );
}
