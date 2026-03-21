import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EditorialAdvertisementProps {
  children: ReactNode;
  label?: string;
  className?: string;
  variant?: 'default' | 'sidebar' | 'banner';
}

export default function EditorialAdvertisement({
  children,
  label = 'Advertisement',
  className = '',
  variant = 'default',
}: EditorialAdvertisementProps) {
  const variantStyles = {
    default: 'p-8',
    sidebar: 'p-4',
    banner: 'p-6 py-12',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`
        relative
        bg-aged-stock/70
        border: 1px dashed border-warm-gray
        text-center
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {/* Advertisement label */}
      <span className="absolute top-3 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-gray">
        {label}
      </span>

      {/* Decorative corners */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-warm-gray/40" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-warm-gray/40" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-warm-gray/40" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-warm-gray/40" />

      {/* Content */}
      <div className="pt-6">
        {children}
      </div>

      {/* Grain overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </motion.div>
  );
}
