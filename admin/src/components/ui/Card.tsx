import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

const paddingMap = {
  none: '0',
  sm: '16px',
  md: '24px',
  lg: '32px',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  style = {},
}: CardProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
    },
    elevated: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)',
    },
    outlined: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'none',
    },
  };

  return (
    <div
      className={className}
      style={{
        ...variantStyles[variant],
        padding: paddingMap[padding],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
    }}>
      <div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--color-text)',
          margin: 0,
          lineHeight: 1.3,
        }}>
          {title}
        </h3>
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
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
}

export function CardContent({ children }: CardContentProps) {
  return <div>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
}

export function CardFooter({ children }: CardFooterProps) {
  return (
    <div style={{
      marginTop: '20px',
      paddingTop: '16px',
      borderTop: '1px solid var(--color-border)',
    }}>
      {children}
    </div>
  );
}

export default Card;