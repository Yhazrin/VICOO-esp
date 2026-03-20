import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import TiltCard from '@/components/animations/TiltCard';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

export default function ProductCard({
  product,
  index = 0,
  className = '',
}: ProductCardProps) {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <TiltCard
      className={`group ${className}`}
      maxTilt={12}
      tiltSpeed={400}
      springConfig={{ stiffness: 250, damping: 35 }}
      shadowIntensity={0.35}
    >
      <motion.article
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: 0.7,
          ease: [0, 0, 0.2, 1],
          delay: index * 0.1,
        }}
        className="h-full"
      >
        <Link to={`/shop/${product.id}`} className="block h-full">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden border-2 border-rust/30 bg-aged-stock mb-5 group-hover:border-rust/50 transition-colors duration-300">
          {/* Vintage frame effect */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/3 via-transparent to-archive-brown/5" />

          {/* Grain overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none opacity-10"
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

          {/* Loading skeleton */}
          {!imageLoaded && <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-[3/4]" />}

          <img
            src={product.imageUrls[0]}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105 sepia-[0.1] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Stock badge */}
          {!product.inStock && (
            <div className="absolute top-3 right-3 z-30 bg-ink/90 text-paper font-body text-caption px-3 py-1 tracking-wider border border-ink">
              {t('shop.card.soldOut')}
            </div>
          )}

          {product.inStock && product.stockCount <= 5 && (
            <div className="absolute top-3 right-3 z-30 bg-rust/95 text-paper font-body text-caption px-3 py-1 tracking-wider border border-rust">
              {t('shop.card.lowStock', { count: product.stockCount })}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 z-15 bg-ink/0 group-hover:bg-ink/5 transition-colors duration-300" />
        </div>

        {/* Info */}
        <div className="px-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display text-base md:text-lg font-semibold text-ink group-hover:text-rust transition-colors leading-tight">
              {product.name}
            </h3>
            <span className="font-body text-[10px] text-sepia-mid uppercase tracking-wider flex-shrink-0 mt-1">
              {product.category}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-ink font-medium">
              {product.currency === 'CNY' ? '¥' : '$'}
              {product.price.toLocaleString()}
            </span>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-px bg-ink/20" />
            <span className="font-mono text-[9px] text-sepia-mid tracking-widest">
              {String(product.id).padStart(3, '0')}
            </span>
            <div className="flex-1 h-px bg-ink/20" />
          </div>
        </div>
        </Link>
      </motion.article>
    </TiltCard>
  );
}
