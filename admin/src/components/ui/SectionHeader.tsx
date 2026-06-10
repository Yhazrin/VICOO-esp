import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  actionAlign?: 'left' | 'right';
}

export function SectionHeader({
  title,
  subtitle,
  action,
  actionAlign = 'right',
}: SectionHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: action ? 'flex-start' : 'center',
      marginBottom: '20px',
      gap: '16px',
    }}>
      <div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: 'var(--color-text)',
          margin: 0,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-2)',
            margin: '4px 0 0',
            lineHeight: 1.5,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div style={{ flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;