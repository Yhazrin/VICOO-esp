import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';

interface EditorialCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  index?: number;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  hoverEffect?: 'lift' | 'glow' | 'border';
}

export const EditorialCard = ({
  title,
  subtitle,
  description,
  image,
  imageAlt,
  index = 0,
  className = '',
  children,
  onClick,
  hoverEffect = 'lift',
}: EditorialCardProps) => {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const hoverClasses = {
    lift: 'hover:-translate-y-1 hover:shadow-lg',
    glow: 'hover:shadow-[0_0_30px_color-mix(in_srgb,var(--color-rust)_15%,transparent)]',
    border: 'hover:border-ink/40',
  };

  return (
    <motion.article
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 40 }}
      animate={isVisible ? (prefersReducedMotion ? undefined : { opacity: 1, y: 0 }) : {}}
      transition={prefersReducedMotion ? { duration: 0 } : {
        duration: 0.6,
        ease: [0, 0, 0.2, 1],
        delay: index * 0.08,
      }}
      className={`
        relative bg-paper border-2 border-rust/30
        ${hoverClasses[hoverEffect]}
        transition-all duration-300 ease-out
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      onKeyDown={onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <SectionGrainOverlay />
      {/* Decorative corner accents — diagonal pattern */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

      {/* Image section */}
      {image && (
        <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-rust/30">
          <SectionGrainOverlay className="z-10" />
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/5 via-transparent to-archive-brown/5" aria-hidden="true" />

          {/* Loading skeleton */}
          {!imageLoaded && <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-[4/3]" />}

          <img
            src={image}
            alt={imageAlt || title}
            className={`w-full h-full object-cover sepia-[0.08] transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}

      {/* Content section */}
      <div className="p-5">
        {subtitle && (
          <span className="font-body text-overline text-rust tracking-[0.2em] uppercase mb-2 block">
            {subtitle}
          </span>
        )}

        <h3 className="font-display text-lg font-semibold text-ink leading-tight mb-2">
          {title}
        </h3>

        {description && (
          <p className="font-body text-caption text-ink-faded leading-relaxed mb-4">
            {description}
          </p>
        )}

        {children}
      </div>

      {/* Hover indicator */}
      {onClick && (
        <div className="absolute bottom-4 right-4 w-6 h-6 rounded-sm border border-ink/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="font-body text-overline text-ink/50">→</span>
        </div>
      )}
    </motion.article>
  );
};

export default EditorialCard;
