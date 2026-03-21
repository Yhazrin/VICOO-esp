import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import type { Artwork } from '@/types';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';

interface ArtworkCardProps {
  artwork: Artwork;
  index?: number;
  className?: string;
}

export default function ArtworkCard({
  artwork,
  index = 0,
  className = '',
}: ArtworkCardProps) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const prefersReducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.article
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 40 }}
      animate={isVisible ? (prefersReducedMotion ? {} : { opacity: 1, y: 0 }) : {}}
      transition={prefersReducedMotion ? { duration: 0 } : {
        duration: 0.7,
        ease: [0, 0, 0.2, 1],
        delay: index * 0.1,
      }}
      className={`group relative ${className}`}
    >
      {/* Corner accents — diagonal pattern */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rust/30 pointer-events-none z-20" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rust/30 pointer-events-none z-20" aria-hidden="true" />

      <Link to={`/artworks/${artwork.id}`} className="block cursor-pointer">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden border-2 border-rust/30 bg-aged-stock mb-4">
          <SectionGrainOverlay className="z-10" />
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/5 via-transparent to-archive-brown/5" aria-hidden="true" />

          {/* Loading skeleton */}
          {!imageLoaded && <ImageSkeleton className="absolute inset-0" />}

          <img
            src={artwork.image_url}
            alt={artwork.title}
            className={`w-full h-full object-cover sepia-[0.08] transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Info */}
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-base md:text-lg font-semibold text-ink truncate group-hover:text-rust transition-colors">
              {artwork.title}
            </h3>
            <p className="font-body text-caption text-sepia-mid mt-1">
              Age {artwork.childParticipant.age} &middot;{' '}
              {new Date(artwork.created_at).getFullYear()}
            </p>
          </div>

          <span className="font-body text-caption text-sepia-mid whitespace-nowrap flex-shrink-0">
            {artwork.vote_count} votes
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
