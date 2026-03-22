import { type ReactNode } from 'react';
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
  const variantBorderColors = {
    default: 'border-rust',
    info: 'border-info',
    warning: 'border-warning',
    success: 'border-success',
    editorial: 'border-archive-brown',
  };

  const variantTitleColors = {
    default: 'text-rust',
    info: 'text-info',
    warning: 'text-warning',
    success: 'text-success',
    editorial: 'text-archive-brown',
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
        ${variantBorderColors[variant]}
        ${variant === 'editorial' ? 'bg-aged-stock/50' : ''}
        ${className}
      `}
    >
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-warm-gray/30 opacity-50" />

      {title && (
        <h4 className={`font-display text-h4 font-bold mb-3 ${variantTitleColors[variant]}`}>
          {title}
        </h4>
      )}

      <div className="font-body text-body text-ink-faded leading-relaxed">
        {children}
      </div>

      {/* Grain overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </motion.div>
  );
}
