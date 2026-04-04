import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary: {
    background: 'var(--color-ink)',
    color: 'var(--color-paper)',
    border: '1px solid var(--color-ink)',
    hoverBg: 'var(--color-rust)',
    hoverColor: 'white',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-ink)',
    border: '1px solid var(--color-ink)',
    hoverBg: 'var(--color-aged-stock)',
    hoverColor: 'var(--color-ink)',
  },
  danger: {
    background: 'var(--color-danger)',
    color: 'white',
    border: '1px solid var(--color-danger)',
    hoverBg: '#5a1515',
    hoverColor: 'white',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-sepia-mid)',
    border: '1px solid transparent',
    hoverBg: 'var(--color-aged-stock)',
    hoverColor: 'var(--color-ink)',
  },
};

const sizes = {
  sm: { padding: '6px 12px', fontSize: '11px' },
  md: { padding: '8px 16px', fontSize: '12px' },
  lg: { padding: '12px 24px', fontSize: '13px' },
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
        borderRadius: '2px', // Minimalist editorial style
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)',
        boxShadow: hover && !disabled ? '4px 4px 0px rgba(26, 26, 22, 0.1)' : 'none',
        transform: hover && !disabled ? 'translate(-2px, -2px)' : 'none',
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
