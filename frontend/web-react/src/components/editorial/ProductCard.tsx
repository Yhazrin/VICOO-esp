import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import TiltCard from '@/components/animations/TiltCard';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import { VintageInput } from '@/components/editorial/VintageInput';
import type { Product } from '@/types';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { companyProductPath, impactProductPath } from '@/utils/productPaths';
import { resolveProductLocale } from '@/utils/productLocale';
import { navigateWithViewTransition, supportsViewTransition } from '@/utils/navigateViewTransition';
import { productsApi } from '@/services/products';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
  /** `impact` → `/impact/shop/:id` (公益壳 + 地球溯源); default 常规商店 */
  detailContext?: 'company' | 'impact';
}

function ProductCard({
  product,
  index = 0,
  className = '',
  detailContext = 'company',
}: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const display = resolveProductLocale(product, i18n.language);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cardImageSrc, setCardImageSrc] = useState(() => product.image_url?.trim() ?? '');
  const artworkFallbackTriedRef = useRef(false);

  useEffect(() => {
    setCardImageSrc(product.image_url?.trim() ?? '');
    setImageLoaded(false);
    artworkFallbackTriedRef.current = false;
  }, [product.id, product.image_url]);

  const tryArtworkImage = useCallback(async () => {
    if (!product.artworkId || artworkFallbackTriedRef.current) return;
    artworkFallbackTriedRef.current = true;
    try {
      const aw = await productsApi.getArtwork(String(product.id));
      if (aw?.image_url) {
        setCardImageSrc(String(aw.image_url).trim());
        setImageLoaded(false);
      }
    } catch {
      /* keep previous src */
    }
  }, [product.artworkId, product.id]);

  useEffect(() => {
    if (cardImageSrc.trim()) return;
    if (!product.artworkId) return;
    void tryArtworkImage();
  }, [cardImageSrc, product.artworkId, tryArtworkImage]);
  const [showNotifyInput, setShowNotifyInput] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (notifyEmail.trim()) {
      setNotifySubmitted(true);
    }
  };

  const detailPath =
    detailContext === 'impact' ? impactProductPath(product.id) : companyProductPath(product.id);

  const impactLinkState =
    detailContext === 'impact'
      ? { impactHeroPreview: cardImageSrc || product.image_url?.trim() || '' }
      : undefined;

  const displayName = display.name;

  const handleDetailLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (detailContext !== 'impact') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const reduceMotion =
      prefersReducedMotion ||
      (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!supportsViewTransition() || reduceMotion) return;
    e.preventDefault();
    navigateWithViewTransition(
      navigate,
      detailPath,
      { state: impactLinkState },
      () => import('@/pages/ProductDetail')
    );
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
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
        animate={prefersReducedMotion ? (isVisible ? { opacity: 1 } : {}) : (isVisible ? { opacity: 1, y: 0 } : {})}
        transition={{
          duration: 0.7,
          ease: [0, 0, 0.2, 1],
          delay: index * 0.1,
        }}
        className="h-full"
      >
        <Link
          to={detailPath}
          state={impactLinkState}
          onClick={handleDetailLinkClick}
          onMouseEnter={() => {
            if (detailContext === 'impact') void import('@/pages/ProductDetail');
          }}
          className="block cursor-pointer"
        >
        {/* Image — view-transition-name 在画框容器上（与详情 SepiaImageFrame 内框对应），不是 hover 遮罩层 */}
        <div
          className="relative aspect-[3/4] overflow-hidden border-2 border-rust/30 bg-aged-stock mb-5 group-hover:border-rust/50 transition-colors duration-300"
          style={
            detailContext === 'impact'
              ? { viewTransitionName: `impact-product-${product.id}` }
              : undefined
          }
        >
          {/* Vintage frame effect */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/3 via-transparent to-archive-brown/5" aria-hidden="true" />

          <SectionGrainOverlay className="z-20" />

          {/* Loading skeleton */}
          {!imageLoaded && <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-[3/4]" />}

          <img
            src={cardImageSrc || ''}
            alt={displayName}
            className={`w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105 sepia-[0.1] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              void tryArtworkImage();
            }}
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
              {displayName}
            </h3>
            <span className="font-body text-overline text-sepia-mid uppercase tracking-wider flex-shrink-0 mt-1">
              {product.category}
            </span>
          </div>

          {/* Artwork attribution */}
          {product.artworkBy && (
            <p className="font-body text-overline text-sepia-mid tracking-wide mb-2">
              {t('shop.card.artworkBy', { name: product.artworkBy.childName, age: product.artworkBy.age })}
              {' '}&mdash; {product.artworkBy.campaign} {t('shop.card.campaign')}
            </p>
          )}

          {/* Impact: donation badge */}
          {product.isImpactProduct && product.donationPercentage != null && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sage" />
              <span className="font-body text-overline text-sage tracking-wider">
                {t('impactShop.donationBadge', { percentage: product.donationPercentage })}
              </span>
            </div>
          )}

          {/* Traceability badge */}
          {product.isImpactProduct && (
            <div className="flex items-center gap-1.5 mb-2">
              <svg className="w-3 h-3 text-sepia-mid" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M2 8h12M5 4l-3 4 3 4M11 4l3 4-3 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-body text-overline text-sepia-mid tracking-wider">
                {t('impactShop.traceable', 'Traceable Supply Chain')}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end">
            <div className="flex flex-col items-end">
              <span className="font-body text-body-sm text-ink font-medium">
                {product.currency === 'CNY' ? '¥' : '$'}
                {product.price.toLocaleString()}
              </span>
              {/* Impact: linked charity campaign (name only; hide raw DB id like #1) */}
              {product.isImpactProduct && product.artworkBy?.campaign && (
                <span className="font-body text-overline text-rust tracking-wider mt-0.5">
                  {t('impactShop.supportsCampaign', { campaign: product.artworkBy.campaign })}
                </span>
              )}
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
                {t('shop.card.notifyMe')}
              </motion.button>
            ) : notifySubmitted ? (
              <motion.p
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 5 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                className="font-body text-overline text-sage tracking-wide text-center py-2"
              >
                {t('shop.card.notifySuccess')}
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
                      label={t('shop.card.notifyEmailLabel')}
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
                    {t('shop.card.send')}
                  </motion.button>
                </motion.form>
              </AnimatePresence>
            )}
          </div>
        )}
      </motion.article>
    </TiltCard>
  );
}

export default memo(ProductCard);
