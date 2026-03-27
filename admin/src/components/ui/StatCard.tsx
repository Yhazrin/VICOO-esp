import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'info';
}

const colorMap = {
  accent: { bg: 'var(--color-accent-light)', icon: 'var(--color-accent)' },
  success: { bg: 'var(--color-success-light)', icon: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-light)', icon: 'var(--color-warning)' },
  danger: { bg: 'var(--color-danger-light)', icon: 'var(--color-danger)' },
  info: { bg: 'var(--color-info-light)', icon: 'var(--color-info)' },
};

export default function StatCard({ title, value, subtitle, icon, trend, color = 'accent' }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 48, height: 48,
          borderRadius: 'var(--radius-md)',
          background: c.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.icon,
        }}>
          {icon}
        </div>
        {trend && (
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: trend.isUp ? 'var(--color-success)' : 'var(--color-danger)',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            {trend.isUp ? '\u2191' : '\u2193'} {trend.value}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
