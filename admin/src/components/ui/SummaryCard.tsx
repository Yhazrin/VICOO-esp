import { Link } from 'react-router-dom';
import './SummaryCard.css';

interface SummaryCardProps {
  title: string;
  subtitle?: string;
  linkTo?: string;
  linkLabel?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function SummaryCard({ title, subtitle, linkTo, linkLabel = '查看全部', children, icon }: SummaryCardProps) {
  return (
    <div className="summary-card">
      <div className="summary-card-header">
        {icon && <span className="summary-card-icon">{icon}</span>}
        <div className="summary-card-title-group">
          <span className="summary-card-title">{title}</span>
          {subtitle && <span className="summary-card-subtitle">{subtitle}</span>}
        </div>
        {linkTo && (
          <Link to={linkTo} className="summary-card-link">
            {linkLabel}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        )}
      </div>
      <div className="summary-card-body">
        {children}
      </div>
    </div>
  );
}

// Mini stat item for summary cards
interface MiniStatProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral' | 'warning' | 'error';
}

export function MiniStat({ label, value, change, trend }: MiniStatProps) {
  const trendClass = trend || (change !== undefined ? (change >= 0 ? 'up' : 'down') : 'neutral');
  return (
    <div className="mini-stat">
      <span className="mini-stat-label">{label}</span>
      <span className="mini-stat-value">{value}</span>
      {change !== undefined && (
        <span className={`mini-stat-change mini-stat-change--${trendClass}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
  );
}

// Compact list item for pending items
interface PendingItemProps {
  title: string;
  meta?: string;
  status?: React.ReactNode;
  time?: string;
}

export function PendingItem({ title, meta, status, time }: PendingItemProps) {
  return (
    <div className="pending-item">
      <div className="pending-item-info">
        <span className="pending-item-title">{title}</span>
        {meta && <span className="pending-item-meta">{meta}</span>}
      </div>
      <div className="pending-item-right">
        {status}
        {time && <span className="pending-item-time">{time}</span>}
      </div>
    </div>
  );
}

export default SummaryCard;