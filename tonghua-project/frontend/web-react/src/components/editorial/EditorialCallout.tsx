import { type ReactNode, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface EditorialCalloutProps {
  children: ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'success' | 'editorial';
  title?: string;
  className?: string;
}

export default function EditorialCallout({
  children,
  variant = 'default',
  title,
  className = '',
}: EditorialCalloutProps) {
  const prefersReducedMotion = useReducedMotion();
  const variantStyles = {
    default: 'border-rust',
    info: 'border-[var(--color-info)]',
    warning: 'border-[var(--color-warning)]',
    success: 'border-[var(--color-success)]',
    editorial: 'border-archive-brown bg-aged-stock/50',
  };

  const titleStyles = {
    default: 'text-rust',
    info: 'text-[var(--color-info)]',
    warning: 'text-[var(--color-warning)]',
    success: 'text-[var(--color-success)]',
    editorial: 'text-archive-brown',
  };

  const accentLineStyles: Record<string, CSSProperties> = {
    default: { background: 'linear-gradient(to bottom, var(--color-rust, #B84B2A), transparent)' },
    info: { background: 'linear-gradient(to bottom, var(--color-info, #4A90D9), transparent)' },
    warning: { background: 'linear-gradient(to bottom, var(--color-warning, #D4A87C), transparent)' },
    success: { background: 'linear-gradient(to bottom, var(--color-success, #7BAE7F), transparent)' },
  };

  return (
    <motion.div
      {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 } })}
      viewport={{ once: true }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
      className={`
        relative
        p-6 md:p-8
        bg-paper
        border-l-4
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-warm-gray/30 opacity-50" aria-hidden="true" />

      {/* Top accent line for non-editorial variants */}
      {variant !== 'editorial' && (
        <div
          className="absolute top-0 left-0 w-px h-full"
          style={accentLineStyles[variant]}
          aria-hidden="true"
        />
      )}

      {title && (
        <h4 className={`font-display text-h4 font-bold mb-3 ${titleStyles[variant]}`}>
          {title}
        </h4>
      )}

      <div className="font-body text-body text-ink-faded leading-relaxed">
        {children}
      </div>

      {/* Grain overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </motion.div>
  );
}
