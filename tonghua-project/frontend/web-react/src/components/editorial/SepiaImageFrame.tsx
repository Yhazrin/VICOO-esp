import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import { OrigamiFoldAccent } from '@/components/animations/OrigamiFold';

interface SepiaImageFrameProps {
  src: string;
  alt: string;
  caption?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide';
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  showCornerAccents?: boolean;
  accentPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'diagonal';
  accentSize?: 'sm' | 'md' | 'lg';
}

const aspectClasses = {
  square: 'aspect-square',
  landscape: 'aspect-[4/3]',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[16/9]',
};

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  full: 'w-full',
};

export default function SepiaImageFrame({
  src,
  alt,
  caption,
  aspectRatio = 'landscape',
  size = 'full',
  className = '',
  showCornerAccents = true,
  accentPosition = 'diagonal',
  accentSize = 'sm',
}: SepiaImageFrameProps) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const prefersReducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Determine corner accent positions based on accentPosition
  const getCornerAccents = () => {
    if (accentPosition === 'diagonal') {
      return [
        { position: 'top-left' as const, intensity: 'subtle' as const },
        { position: 'bottom-right' as const, intensity: 'medium' as const },
      ];
    }
    return [{ position: accentPosition as Exclude<typeof accentPosition, 'diagonal'>, intensity: 'medium' as const }];
  };

  const cornerAccents = getCornerAccents();

  return (
    <motion.figure
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
      animate={isVisible ? (prefersReducedMotion ? {} : { opacity: 1, y: 0 }) : {}}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: [0, 0, 0.2, 1] }}
      className={`${sizeClasses[size]} ${className}`}
    >
      <div
        className={`
          ${aspectClasses[aspectRatio]}
          relative overflow-hidden
          border border-warm-gray/60
          bg-aged-stock
        `}
      >
        {/* Origami corner accents */}
        {showCornerAccents && cornerAccents.map((accent, index) => (
          <OrigamiFoldAccent
            key={`accent-${index}`}
            position={accent.position}
            size={accentSize}
            intensity={accent.intensity}
          />
        ))}
        {/* Aged overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/5 via-transparent to-archive-brown/5" />

        {/* Vignette */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 60px color-mix(in srgb, var(--color-ink) 12%, transparent)',
          }}
        />

        {/* Loading skeleton */}
        {!imageLoaded && <ImageSkeleton className="absolute inset-0" aspectRatio={aspectClasses[aspectRatio]} />}

        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {caption && (
        <figcaption className="font-body text-caption text-sepia-mid mt-3 tracking-wide">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}
