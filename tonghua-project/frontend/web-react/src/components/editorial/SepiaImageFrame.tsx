import { useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';

interface SepiaImageFrameProps {
  src: string;
  alt: string;
  caption?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide';
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
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
}: SepiaImageFrameProps) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.figure
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0, 0, 0.2, 1] }}
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
        {/* Aged overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/5 via-transparent to-archive-brown/5" />

        {/* Vignette */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 60px rgba(26, 26, 22, 0.12)',
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
