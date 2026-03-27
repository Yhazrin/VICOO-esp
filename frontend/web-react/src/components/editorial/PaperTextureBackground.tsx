import { type ReactNode } from 'react';

interface PaperTextureBackgroundProps {
  children: ReactNode;
  variant?: 'paper' | 'aged' | 'dark';
  className?: string;
}

export default function PaperTextureBackground({
  children,
  variant = 'paper',
  className = '',
}: PaperTextureBackgroundProps) {
  const bgClasses = {
    paper: 'bg-paper',
    aged: 'bg-aged-stock',
    dark: 'bg-ink text-paper',
  };

  return (
    <div className={`relative ${bgClasses[variant]} ${className}`}>
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px',
        }}
      />

      {/* Content */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
