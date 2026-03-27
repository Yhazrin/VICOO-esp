import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary: {
    background: 'var(--color-accent)',
    color: '#fff',
    border: 'none',
    hoverBg: 'var(--color-accent-hover)',
  },
  secondary: {
    background: 'var(--color-bg-card)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    hoverBg: '#f9f9f7',
  },
  danger: {
    background: 'var(--color-danger)',
    color: '#fff',
    border: 'none',
    hoverBg: '#b34a4a',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid transparent',
    hoverBg: '#f3f4f6',
  },
};

const sizes = {
  sm: { padding: '6px 12px', fontSize: 12 },
  md: { padding: '8px 16px', fontSize: 13 },
  lg: { padding: '10px 20px', fontSize: 14 },
};

export default function Button({
  variant = 'primary', size = 'md', loading, icon, children, style, disabled, ...rest
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];

  return (
    <button
      disabled={disabled || loading}
      style={{
        ...s,
        background: v.background,
        color: v.color,
        border: v.border,
        borderRadius: 'var(--radius-sm)',
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span style={{
          width: 14, height: 14,
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
          display: 'inline-block',
        }} />
      ) : icon}
      {children}
    </button>
  );
}
