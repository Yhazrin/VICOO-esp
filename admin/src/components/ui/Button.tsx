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
    color: 'var(--color-bg)',
    border: '1px solid var(--color-accent)',
    hoverBg: 'var(--color-text-2)',
    hoverColor: 'var(--color-bg)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-text-2)',
    border: '1px solid rgba(255,255,255,0.12)',
    hoverBg: 'rgba(255,255,255,0.06)',
    hoverColor: 'var(--color-text)',
  },
  danger: {
    background: 'rgba(239,68,68,0.15)',
    color: '#EF4444',
    border: '1px solid rgba(239,68,68,0.3)',
    hoverBg: 'rgba(239,68,68,0.25)',
    hoverColor: '#EF4444',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-3)',
    border: '1px solid transparent',
    hoverBg: 'rgba(255,255,255,0.06)',
    hoverColor: 'var(--color-text-2)',
  },
};

const sizes = {
  sm: { padding: '5px 10px', fontSize: '11px' },
  md: { padding: '7px 14px', fontSize: '12px' },
  lg: { padding: '9px 18px', fontSize: '13px' },
};

export default function Button({
  variant = 'primary', size = 'md', loading, icon, children, style, disabled, ...rest
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  const [hover, setHover] = React.useState(false);

  return (
    <button
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...s,
        background: hover ? v.hoverBg : v.background,
        color: hover ? v.hoverColor : v.color,
        border: v.border,
        borderRadius: '6px',
        fontWeight: 500,
        letterSpacing: '0.02em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)',
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span style={{
          width: 12, height: 12,
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
