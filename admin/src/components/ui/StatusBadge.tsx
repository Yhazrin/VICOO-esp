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
  draft: { bg: '#f3f4f6', color: '#6b7280', label: '草稿' },
  active: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: '进行中' },
  ended: { bg: '#f3f4f6', color: '#6b7280', label: '已结束' },
  // Order
  paid: { bg: 'var(--color-info-light)', color: 'var(--color-info)', label: '已支付' },
  shipped: { bg: 'var(--color-accent-light)', color: 'var(--color-accent)', label: '已发货' },
  delivered: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: '已送达' },
  cancelled: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', label: '已取消' },
  refunded: { bg: '#f3f4f6', color: '#6b7280', label: '已退款' },
  // Donation
  completed: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: '已完成' },
  failed: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', label: '失败' },
  // User
  disabled: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', label: '已禁用' },
  // Child participant
  withdrawn: { bg: '#f3f4f6', color: '#6b7280', label: '已退出' },
  pending_review: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', label: '待审查' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap',
    }}>
      {label || style.label}
    </span>
  );
}
