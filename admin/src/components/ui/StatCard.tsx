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
  accent: { bg: 'rgba(255,255,255,0.06)', icon: 'var(--color-text-2)' },
  success: { bg: 'var(--color-success-bg)', icon: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-bg)', icon: 'var(--color-warning)' },
  danger: { bg: 'var(--color-error-bg)', icon: 'var(--color-error)' },
  info: { bg: 'var(--color-info-bg)', icon: 'var(--color-info)' },
};

export default function StatCard({ title, value, subtitle, icon, trend, color = 'accent' }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40,
          borderRadius: '8px',
          background: c.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.icon,
        }}>
          {icon}
        </div>
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-mono)',
            color: trend.isUp ? 'var(--color-success)' : 'var(--color-error)',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            {trend.isUp ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2, fontFamily: 'var(--font-mono)' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
