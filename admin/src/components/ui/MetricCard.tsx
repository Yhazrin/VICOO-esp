import React from 'react';
import { Link } from 'react-router-dom';
import './MetricCard.css';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'info' | 'muted';
  loading?: boolean;
  href?: string; // Make card clickable if href is provided
}

const colorMap = {
  primary: {
    iconBg: 'var(--color-primary-light)',
    iconColor: 'var(--color-primary)',
    trendUp: 'var(--color-primary)',
    trendDown: 'var(--color-error)',
  },
  success: {
    iconBg: 'var(--color-success-bg)',
    iconColor: 'var(--color-success)',
    trendUp: 'var(--color-success)',
    trendDown: 'var(--color-error)',
  },
  warning: {
    iconBg: 'var(--color-warning-bg)',
    iconColor: 'var(--color-warning)',
    trendUp: 'var(--color-success)',
    trendDown: 'var(--color-error)',
  },
  info: {
    iconBg: 'var(--color-info-bg)',
    iconColor: 'var(--color-info)',
    trendUp: 'var(--color-success)',
    trendDown: 'var(--color-error)',
  },
  muted: {
    iconBg: 'var(--color-elevated)',
    iconColor: 'var(--color-text-3)',
    trendUp: 'var(--color-success)',
    trendDown: 'var(--color-error)',
  },
};

export function MetricCard({
  label,
  value,
  icon,
  trend,
  subtitle,
  color = 'primary',
  loading = false,
  href,
}: MetricCardProps) {
  const c = colorMap[color];

  if (loading) {
    return (
      <div className="metric-card metric-card--loading">
        <div className="metric-card-skeleton metric-card-skeleton--icon" />
        <div className="metric-card-skeleton metric-card-skeleton--label" />
        <div className="metric-card-skeleton metric-card-skeleton--value" />
      </div>
    );
  }

  const cardContent = (
    <>
      <div className="metric-card-header">
        <div
          className="metric-card-icon"
          style={{ background: c.iconBg, color: c.iconColor }}
        >
          {icon}
        </div>
        {trend && (
          <div
            className="metric-card-trend"
            style={{ color: trend.value >= 0 ? c.trendUp : c.trendDown }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {trend.value >= 0 ? (
                <polyline points="18 15 12 9 6 15" />
              ) : (
                <polyline points="6 9 12 15 18 9" />
              )}
            </svg>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="metric-card-body">
        <div className="metric-card-value">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="metric-card-label">{label}</div>
        {(trend?.label || subtitle) && (
          <div className="metric-card-subtitle">
            {trend?.label || subtitle}
          </div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link to={href} className="metric-card metric-card--link">
        {cardContent}
      </Link>
    );
  }

  return <div className="metric-card">{cardContent}</div>;
}

export default MetricCard;
