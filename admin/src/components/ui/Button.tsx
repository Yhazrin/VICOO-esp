import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  pill?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  style,
  disabled,
  type = 'button',
  pill = true,
  ...rest
}: ButtonProps) {
  const classNames = [
    'admin-btn',
    `admin-btn--${variant}`,
    `admin-btn--${size}`,
    pill ? 'admin-btn--pill' : '',
    (disabled || loading) ? 'admin-btn--disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classNames}
      style={style}
      {...rest}
    >
      {loading ? (
        <span className="admin-btn__spinner" />
      ) : icon ? (
        <span className="admin-btn__icon">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}