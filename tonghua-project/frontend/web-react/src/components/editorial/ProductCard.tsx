import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import TiltCard from '@/components/animations/TiltCard';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import { VintageInput } from '@/components/editorial/VintageInput';
import type { Product } from '@/types';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

function getSustainabilityTier(score: number): { label: string; colorClass: string; barColor: string } {
  if (score >= 90) return { label: 'Exceptional', colorClass: 'text-rust', barColor: 'bg-rust' };
  if (score >= 80) return { label: 'Excellent', colorClass: 'text-sage', barColor: 'bg-sage' };
  return { label: 'Good', colorClass: 'text-sepia-mid', barColor: 'bg-sepia-mid' };
}

export default function ProductCard({
  product,
  index = 0,
  className = '',
}: ProductCardProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showNotifyInput, setShowNotifyInput] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const sustainability = getSustainabilityTier(product.sustainabilityScore);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (notifyEmail.trim()) {
      setNotifySubmitted(true);
    }
  };

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
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
        animate={prefersReducedMotion ? (isVisible ? { opacity: 1 } : {}) : (isVisible ? { opacity: 1, y: 0 } : {})}
        transition={{
          duration: 0.7,
          ease: [0, 0, 0.2, 1],
          delay: index * 0.1,
        }}
        className="h-full"
      >
        <Link to={`/shop/${product.id}`} className="block cursor-pointer">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden border-2 border-rust/30 bg-aged-stock mb-5 group-hover:border-rust/50 transition-colors duration-300">
          {/* Vintage frame effect */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/3 via-transparent to-archive-brown/5" aria-hidden="true" />

          <SectionGrainOverlay className="z-20" />

          {/* Loading skeleton */}
          {!imageLoaded && <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-[3/4]" />}

          <img
            src={product.image_url ?? ''}
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
          <div className="absolute inset-0 z-15 bg-ink/0 group-hover:bg-ink/5 transition-colors duration-300" aria-hidden="true" />
        </div>

        {/* Info */}
        <div className="px-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-display text-base md:text-lg font-semibold text-ink group-hover:text-rust transition-colors leading-tight">
              {product.name}
            </h3>
            <span className="font-body text-overline text-sepia-mid uppercase tracking-wider flex-shrink-0 mt-1">
              {product.category}
            </span>
          </div>

          {/* Artwork attribution */}
          {product.artworkBy && (
            <p className="font-body text-overline text-sepia-mid tracking-wide mb-2">
              Artwork by {product.artworkBy.childName}, age {product.artworkBy.age}
              {' '}&mdash; {product.artworkBy.campaign} campaign
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="font-body text-body-sm text-ink font-medium">
              {product.currency === 'CNY' ? '¥' : '$'}
              {product.price.toLocaleString()}
            </span>

            {/* Sustainability score with tier */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="font-body text-overline text-sepia-mid">
                  {product.sustainabilityScore}
                </span>
                <span className={`font-body text-overline tracking-wide ${sustainability.colorClass}`}>
                  {sustainability.label}
                </span>
              </div>
              <div className="w-12 h-px bg-warm-gray/30 mt-0.5 overflow-hidden">
                <motion.div
                  className={`h-full origin-left ${sustainability.barColor}`}
                  initial={prefersReducedMotion ? { scaleX: product.sustainabilityScore / 100 } : { scaleX: 0 }}
                  animate={isVisible ? { scaleX: product.sustainabilityScore / 100 } : {}}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0, 0, 0.2, 1] }}
                />
              </div>
            </div>
          </div>
        </div>
        </Link>

        {/* Notify Me for out-of-stock — outside Link to avoid <form> inside <a> */}
        {!product.inStock && (
          <div className="mt-3 px-1">
            {!showNotifyInput ? (
              <motion.button
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowNotifyInput(true);
                }}
                className="w-full font-body text-overline tracking-[0.15em] uppercase text-sepia-mid py-2 px-4 border border-dashed border-sepia-mid/50 hover:border-sepia-mid hover:text-ink transition-all duration-200 bg-transparent cursor-pointer"
              >
                Notify Me
              </motion.button>
            ) : notifySubmitted ? (
              <motion.p
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 5 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                className="font-body text-overline text-sage tracking-wide text-center py-2"
              >
                We will let you know when this is back.
              </motion.p>
            ) : (
              <AnimatePresence>
                <motion.form
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleNotifySubmit}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1">
                    <VintageInput
                      type="email"
                      label="Email"
                      placeholder="your@email.com"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      icon="email"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                    className="font-body text-overline tracking-[0.1em] uppercase text-paper bg-rust px-3 py-3 border border-rust hover:bg-rust/90 transition-colors flex-shrink-0"
                  >
                    Send
                  </motion.button>
                </motion.form>
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Decorative divider */}
        <div className="flex items-center gap-2 mt-3 px-1">
          <div className="flex-1 h-px bg-ink/20" />
          <span className="font-body text-overline text-sepia-mid tracking-widest">
            {String(product.id).padStart(3, '0')}
          </span>
          <div className="flex-1 h-px bg-ink/20" />
        </div>
      </motion.article>
    </TiltCard>
  );
}
