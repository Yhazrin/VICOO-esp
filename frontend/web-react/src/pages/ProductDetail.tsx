import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation, matchPath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';

import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import TraceabilityTimeline from '@/components/editorial/TraceabilityTimeline';
import TraceabilityGlobe from '@/components/editorial/TraceabilityGlobe';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { productsApi } from '@/services/products';
import { supplyChainApi } from '@/services/supply-chain';
import ProductReviewsSection from '@/components/product/ProductReviewsSection';
import { useAuthStore } from '@/stores/authStore';
import type { SupplyChainTimelineRecord, TraceMediaItem } from '@/types';
import { companyProductPath, impactProductPath } from '@/utils/productPaths';
import { resolveProductLocale } from '@/utils/productLocale';
import { navigateWithViewTransition, supportsViewTransition } from '@/utils/navigateViewTransition';

function supplyChainStageLabel(stage: string, t: (key: string) => string): string {
  const key = stage.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const tr = t(`traceability.stages.${key}`);
  if (tr !== `traceability.stages.${key}`) return tr;
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function ThumbnailButton({
  url,
  selected,
  onSelect,
  ariaLabel,
}: {
  url: string;
  selected: boolean;
  onSelect: () => void;
  ariaLabel: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      onClick={onSelect}
      aria-label={ariaLabel}
      className={`w-16 h-16 overflow-hidden rounded-lg border transition-all duration-300 relative cursor-pointer ${
        selected
          ? 'border-ink/90 ring-1 ring-ink/20 ring-offset-2 ring-offset-paper'
          : 'border-warm-gray/20 hover:border-warm-gray/45'
      }`}
    >
      {!loaded && <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-square" />}
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className={`w-full h-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ filter: 'sepia(0.2) contrast(1.05) brightness(0.97)' }}
        onLoad={() => setLoaded(true)}
      />
    </button>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const impactHeroPreview =
    typeof location.state === 'object' && location.state != null && 'impactHeroPreview' in location.state
      ? String((location.state as { impactHeroPreview?: string }).impactHeroPreview ?? '').trim()
      : '';
  const isImpactProductDetail = Boolean(
    matchPath({ path: '/impact/shop/:id', end: true }, pathname)
  );
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const prefersReducedMotion = useReducedMotion();
  const currentTheme = useUIStore((s) => s.currentTheme);
  const { data: product, isLoading: loading } = useQuery({
    queryKey: ['product', id, i18n.language],
    queryFn: () => productsApi.getById(id!, i18n.language),
    enabled: !!id,
    retry: false,
  });

  const { data: linkedArtwork } = useQuery({
    queryKey: ['product-artwork', id, i18n.language],
    queryFn: () => productsApi.getArtwork(id!, i18n.language),
    enabled: !!id && !!product?.artworkId,
    retry: false,
  });

  const { data: supplyChainRaw = [] } = useQuery({
    queryKey: ['product-supply-chain', id, i18n.language],
    queryFn: () => supplyChainApi.getProductJourney(id!, i18n.language),
    enabled: !!id && !!product,
    retry: false,
  });

  const timelineRecords: SupplyChainTimelineRecord[] = useMemo(
    () =>
      supplyChainRaw.map((r, i) => {
        const rawGallery = (r as { gallery?: unknown }).gallery;
        const gallery: TraceMediaItem[] = Array.isArray(rawGallery)
          ? rawGallery
              .map((x: { type?: string; url?: string; caption?: string }) => ({
                type: x?.type === 'video' ? ('video' as const) : ('image' as const),
                url: String(x?.url ?? '').trim(),
                caption: x?.caption != null ? String(x.caption) : undefined,
              }))
              .filter((x) => x.url)
          : [];
        return {
          id: Number(r.id) || i + 1,
          stage: r.stage,
          description: r.description,
          location: r.location,
          date: r.timestamp ? r.timestamp.split('T')[0] : '',
          verified: r.certified ?? false,
          partnerName: r.artisan?.name ?? r.productName ?? '',
          carbonFootprint: r.carbon_kg,
          carbon_kg: r.carbon_kg,
          carbon_note: r.carbon_note,
          latitude: r.latitude,
          longitude: r.longitude,
          gallery,
        };
      }),
    [supplyChainRaw]
  );

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [globePinId, setGlobePinId] = useState<number | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const addedTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setGlobePinId(null);
  }, [id]);

  const safeProduct = useMemo(() => {
    if (!product) {
      return {
        name: '',
        description: '',
        category: '',
        price: 0,
        currency: 'CNY',
        inStock: true,
        sustainabilityScore: 0,
        image_url: '',
        sizes: undefined as string[] | undefined,
        colors: undefined as { name: string; hex: string }[] | undefined,
        traceStoryTitle: '',
        traceStoryContent: '',
      };
    }
    const loc = resolveProductLocale(product, i18n.language);
    return {
      name: loc.name,
      description: loc.description,
      category: product.category ?? '',
      price: product.price ?? 0,
      currency: product.currency ?? 'CNY',
      inStock: product.inStock ?? true,
      sustainabilityScore: product.sustainabilityScore ?? 0,
      image_url: product.image_url ?? '',
      sizes: product.sizes ?? undefined,
      colors: product.colors ?? undefined,
      traceStoryTitle: loc.traceStoryTitle.trim(),
      traceStoryContent: loc.traceStoryContent.trim(),
    };
  }, [product, i18n.language]);
  const hasTraceStory = Boolean(
    product && (safeProduct.traceStoryTitle || safeProduct.traceStoryContent)
  );

  useEffect(() => {
    if (!product || !id) return;
    if (product.isImpactProduct && !isImpactProductDetail) {
      navigate(impactProductPath(id), { replace: true });
    } else if (product.isImpactProduct === false && isImpactProductDetail) {
      navigate(companyProductPath(id), { replace: true });
    }
  }, [product, id, isImpactProductDetail, navigate]);

  const productImages = useMemo(() => {
    const primary = product?.image_url?.trim();
    const fromArt = linkedArtwork?.image_url?.trim();
    if (primary) return [primary];
    if (fromArt) return [fromArt];
    return [];
  }, [product?.image_url, linkedArtwork?.image_url]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    addItem(product, quantity, selectedSize || undefined, selectedColor || undefined);
    setAdded(true);
    setCartOpen(true);
    if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current);
    addedTimeoutRef.current = setTimeout(() => setAdded(false), 2000);
  };

  const handleBackToImpactShopClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isImpactProductDetail) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const reduceMotion =
      prefersReducedMotion ||
      (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!supportsViewTransition() || reduceMotion) return;
    e.preventDefault();
    navigateWithViewTransition(
      navigate,
      '/impact/shop',
      {},
      () => import('@/pages/ImpactShop')
    );
  };

  if (loading || !product) {
    if (isImpactProductDetail && impactHeroPreview && id) {
      return (
        <PageWrapper>
          <PaperTextureBackground variant="paper" className="pt-0 pb-16 md:pb-24">
            <SectionContainer>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-14 md:gap-20 lg:gap-24 items-start">
                <div className="md:col-span-6 lg:col-span-7">
                  <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} transition={{ duration: 0 }}>
                    <SepiaImageFrame
                      src={impactHeroPreview}
                      alt=""
                      aspectRatio="portrait"
                      size="full"
                      viewTransitionName={`impact-product-${id}`}
                      instantReveal
                    />
                  </motion.div>
                </div>
                <div className="md:col-span-5 md:col-start-8 lg:col-span-5 lg:col-start-8 md:pt-2">
                  <p className="font-body text-sepia-mid">{t('shop.detail.loading')}</p>
                </div>
              </div>
            </SectionContainer>
          </PaperTextureBackground>
        </PageWrapper>
      );
    }
    return (
      <PageWrapper>
        <PaperTextureBackground variant="paper" className="py-16 md:py-24">
          <SectionContainer>
            <p className="font-body text-sepia-mid">{t('shop.detail.loading')}</p>
          </SectionContainer>
        </PaperTextureBackground>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Product section */}
      <PaperTextureBackground variant="paper" className="pt-0 pb-16 md:pb-24">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 lg:gap-16 items-stretch">
            {/* Images */}
            <div className="md:col-span-6 lg:col-span-7 flex flex-col">
              <motion.div
                className="w-full"
                initial={
                  prefersReducedMotion || isImpactProductDetail ? { opacity: 1 } : { opacity: 0 }
                }
                animate={{ opacity: 1 }}
                transition={
                  isImpactProductDetail
                    ? { duration: 0 }
                    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
                }
              >
                {productImages.length > 0 ? (
                <SepiaImageFrame
                  src={productImages[selectedImage] ?? productImages[0]}
                  alt={safeProduct.name}
                  aspectRatio="portrait"
                  size="full"
                  viewTransitionName={
                    isImpactProductDetail && id && selectedImage === 0
                      ? `impact-product-${id}`
                      : undefined
                  }
                  instantReveal={isImpactProductDetail}
                />
                ) : (
                  <div
                    className="aspect-[3/4] w-full flex items-center justify-center border border-warm-gray/40 bg-aged-stock text-sepia-mid font-body text-caption px-6 text-center"
                    role="img"
                    aria-label={t('shop.detail.noImage')}
                  >
                    {t('shop.detail.noImage')}
                  </div>
                )}
              </motion.div>
              {productImages.length > 1 && (
                <div className="flex gap-3 mt-6">
                  {productImages.map((url, index) => (
                    <ThumbnailButton
                      key={url}
                      url={url}
                      selected={selectedImage === index}
                      onSelect={() => setSelectedImage(index)}
                      ariaLabel={t('shop.detail.viewImageAria', { n: index + 1 })}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details — 桌面端与左栏等高；叙事在上，购买区 mt-auto 贴底 */}
            <div className="md:col-span-5 md:col-start-8 lg:col-span-5 lg:col-start-8 flex flex-col md:h-full md:min-h-0">
              <div className="flex flex-col md:flex-1 md:min-h-0 md:h-full">
                <div className="space-y-7 md:space-y-9">
                  <header className="space-y-4">
                    <span className="inline-block font-body text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-sepia-mid px-3 py-1 rounded-full border border-warm-gray/20 bg-warm-gray/5">
                      {t(`shop.filters.${safeProduct.category}`, safeProduct.category)}
                    </span>
                    <h1 className="font-display text-[clamp(1.85rem,3.6vw,2.85rem)] text-ink font-semibold leading-[1.05] tracking-[-0.03em]">
                      {safeProduct.name}
                    </h1>
                  </header>

                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-body text-[10px] tracking-[0.28em] uppercase text-sepia-mid">
                      {t('shop.detail.priceLabel')}
                    </span>
                    <p className="font-display text-[clamp(1.85rem,3.5vw,2.5rem)] text-ink tabular-nums tracking-tight">
                      <span className="text-sepia-mid text-sm md:text-base font-body font-normal tracking-[0.18em] uppercase mr-2">
                        {safeProduct.currency}
                      </span>
                      {Number(safeProduct.price).toFixed(2)}
                    </p>
                  </div>

                  {safeProduct.description.trim() && (
                    <div className="max-w-[32rem] rounded-xl border border-warm-gray/15 bg-warm-gray/5 px-5 py-4">
                      <p className="font-body text-base md:text-[1.0625rem] text-ink/92 leading-[1.78]">
                        {safeProduct.description}
                      </p>
                    </div>
                  )}

                  {linkedArtwork && (
                    <div className="rounded-xl border border-warm-gray/20 bg-gradient-to-br from-paper/90 to-aged-stock/50 px-5 py-5 shadow-sm">
                      <p className="font-body text-[10px] tracking-[0.24em] uppercase text-sepia-mid mb-3">
                        {t('shop.detail.artwork')}
                      </p>
                      <p className="font-display text-lg md:text-xl text-ink leading-snug tracking-tight">
                        {linkedArtwork.artist_name || linkedArtwork.title}
                      </p>
                      {linkedArtwork.artist_name &&
                        linkedArtwork.title &&
                        linkedArtwork.artist_name !== linkedArtwork.title && (
                          <p className="font-body text-body-sm text-ink-faded/90 mt-2 leading-relaxed">
                            {linkedArtwork.title}
                          </p>
                        )}
                    </div>
                  )}

                  {hasTraceStory && (
                    <div className="rounded-xl border border-warm-gray/20 bg-aged-stock/30 px-5 py-5 md:px-6 md:py-6">
                      <p className="font-body text-[10px] tracking-[0.24em] uppercase text-sepia-mid mb-3">
                        {t('shop.detail.traceStory')}
                      </p>
                      {safeProduct.traceStoryTitle && (
                        <p className="font-display text-xl md:text-2xl text-ink leading-snug tracking-tight mb-2">
                          {safeProduct.traceStoryTitle}
                        </p>
                      )}
                      {safeProduct.traceStoryContent && (
                        <p className="font-body text-body-sm md:text-body text-ink-faded leading-[1.85] whitespace-pre-wrap">
                          {safeProduct.traceStoryContent}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-10 md:mt-auto pt-10 md:pt-12 border-t border-warm-gray/18 space-y-9">
                  {safeProduct.sizes && safeProduct.sizes.length > 0 && (
                    <div>
                      <p className="font-body text-[10px] tracking-[0.22em] uppercase text-sepia-mid mb-4">
                        {t('shop.detail.size')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {safeProduct.sizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                            className={`
                          min-w-[44px] h-10 px-4 rounded-full font-mono text-xs flex items-center justify-center transition-colors duration-300 cursor-pointer
                          ${selectedSize === size
                            ? 'bg-ink text-paper border border-ink'
                            : 'bg-transparent text-ink border border-warm-gray/25 hover:border-warm-gray/50'
                          }
                        `}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {safeProduct.colors && safeProduct.colors.length > 0 && (
                    <div>
                      <p className="font-body text-[10px] tracking-[0.22em] uppercase text-sepia-mid mb-4">
                        {t('shop.detail.color')}
                        {selectedColor && (
                          <span className="text-ink ml-2 normal-case tracking-normal font-body text-caption">
                            {selectedColor}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {safeProduct.colors.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setSelectedColor(selectedColor === color.name ? '' : color.name)}
                            className={`
                          w-9 h-9 rounded-full border transition-colors duration-300 cursor-pointer
                          ${selectedColor === color.name
                            ? 'border-ink ring-1 ring-ink/25 ring-offset-2 ring-offset-paper'
                            : 'border-warm-gray/25 hover:border-warm-gray/50'
                          }
                        `}
                            style={{ backgroundColor: color.hex }}
                            aria-label={color.name}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-warm-gray/18 bg-paper/35 px-4 py-4 md:px-5 md:py-5">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
                      <p className="font-body text-[10px] tracking-[0.22em] uppercase text-sepia-mid">
                        {t('shop.detail.sustainability')}
                      </p>
                      <p className="font-display text-3xl md:text-4xl text-ink tabular-nums leading-none tracking-tight">
                        {safeProduct.sustainabilityScore}
                        <span className="font-body text-sm text-sepia-mid font-normal">/100</span>
                      </p>
                    </div>
                    <div
                      className="h-1.5 w-full rounded-full bg-warm-gray/25 overflow-hidden"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sage/70 to-sage transition-[width] duration-500 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, safeProduct.sustainabilityScore))}%` }}
                      />
                    </div>
                    <div className="flex gap-1.5 mt-3" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-sm ${
                            level <= safeProduct.sustainabilityScore / 20 ? 'bg-sage/55' : 'bg-warm-gray/22'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="font-body text-[10px] tracking-[0.22em] uppercase text-sepia-mid sm:min-w-[5rem]">
                      {t('shop.detail.quantity')}
                    </label>
                    <div className="inline-flex items-center rounded-full border border-warm-gray/25 bg-warm-gray/5">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        aria-label={t('cart.decreaseQuantity')}
                        className="min-w-[44px] min-h-[44px] px-3 py-2 text-ink hover:bg-warm-gray/15 transition-colors duration-300 cursor-pointer rounded-l-full"
                      >
                        −
                      </button>
                      <span className="font-mono text-sm px-5 py-2 text-ink tabular-nums" aria-live="polite">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        aria-label={t('cart.increaseQuantity')}
                        className="min-w-[44px] min-h-[44px] px-3 py-2 text-ink hover:bg-warm-gray/15 transition-colors duration-300 cursor-pointer rounded-r-full"
                      >
                        +
                      </button>
                    </div>
                  </div>

                    <div className="w-full sm:w-auto flex gap-3">
                      <motion.button
                        type="button"
                        whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                        whileTap={prefersReducedMotion ? undefined : { y: 0 }}
                        transition={{ type: 'spring', stiffness: 520, damping: 28 }}
                        onClick={handleAddToCart}
                        disabled={!safeProduct.inStock}
                        className={`flex-1 sm:flex-none font-body text-[11px] md:text-body-sm tracking-[0.22em] uppercase px-8 py-4 md:py-[1.125rem] rounded-full shadow-[0_14px_40px_-22px_rgba(18,17,14,0.55)] transition-colors duration-500 ${
                          added
                            ? 'bg-sage text-paper'
                            : safeProduct.inStock
                              ? 'bg-ink text-paper hover:bg-ink-faded cursor-pointer'
                              : 'bg-warm-gray/50 text-ink-faded cursor-not-allowed'
                        }`}
                      >
                        {!safeProduct.inStock
                          ? t('shop.card.soldOut')
                          : added
                            ? t('shop.detail.added') + ' \u2713'
                            : t('shop.detail.addToCart')}
                      </motion.button>

                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('ai-assistant-prefill', {
                            detail: {
                              text: t('aiAssistant.productPrefill', { id }),
                              metadata: { product_id: Number(id), impactMode: product.isImpactProduct },
                            },
                          }));
                        }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-full border border-warm-gray/25 bg-paper px-4 py-3 text-ink text-[11px] tracking-[0.12em] uppercase hover:bg-aged-stock transition-colors cursor-pointer"
                      >
                        {t('aiAssistant.askAboutProduct')}
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      <PaperTextureBackground
        variant="aged"
        className={`overflow-visible ${
          product.isImpactProduct && isImpactProductDetail && timelineRecords.length > 0
            ? 'py-0'
            : 'py-12 md:py-16'
        }`}
      >
        {product.isImpactProduct && isImpactProductDetail && timelineRecords.length > 0 && (
          <>
            {/* 全幅背景地球仪：横纵铺满视口感，不受 Paper 区块 padding / max-h 限制；时间线单独留白 */}
            <section className="relative isolate w-full overflow-visible">
              <div className="relative min-h-[100dvh] w-full">
                <div className="absolute inset-0 z-0 w-[100vw] max-w-none min-h-[100dvh] left-1/2 -translate-x-1/2 pointer-events-none">
                  <div className="pointer-events-auto relative h-full min-h-[inherit] w-full">
                    <TraceabilityGlobe
                      themeKey={currentTheme}
                      ambientBackdrop
                      records={timelineRecords}
                      selectedId={globePinId}
                      onSelect={setGlobePinId}
                      prefersReducedMotion={Boolean(prefersReducedMotion)}
                      getStageLabel={(stage) => supplyChainStageLabel(stage, t)}
                    />
                  </div>
                </div>
              </div>

              {globePinId != null && (
                <p className="relative z-[8] mt-5 text-center font-body text-[10px] md:text-[11px] tracking-[0.14em] uppercase text-sepia-mid/85 max-w-md mx-auto leading-relaxed px-4">
                  {t('shop.detail.globeDefocusHint')}
                </p>
              )}

              <div className="relative z-20 -mt-[min(28dvh,15rem)] bg-gradient-to-b from-transparent via-aged-stock/90 to-aged-stock pt-[min(22dvh,11rem)] pb-12 md:pb-16">
                <SectionContainer className="!pt-0">
                  <TraceabilityTimeline
                    records={timelineRecords}
                    linkedFromGlobeId={globePinId}
                    getStageLabel={(stage) => supplyChainStageLabel(stage, t)}
                  />
                </SectionContainer>
              </div>
            </section>
          </>
        )}

        {!(product.isImpactProduct && isImpactProductDetail && timelineRecords.length > 0) && (
          <SectionContainer>
            <TraceabilityTimeline
              records={timelineRecords}
              linkedFromGlobeId={globePinId}
              getStageLabel={(stage) => supplyChainStageLabel(stage, t)}
            />
          </SectionContainer>
        )}
      </PaperTextureBackground>

      <PaperTextureBackground variant="paper">
        {id && <ProductReviewsSection productId={Number(id)} />}
      </PaperTextureBackground>

      {/* Back link */}
      <SectionContainer className="py-10">
        <Link
          to={isImpactProductDetail ? '/impact/shop' : '/shop'}
          onClick={handleBackToImpactShopClick}
          onMouseEnter={isImpactProductDetail ? () => void import('@/pages/ImpactShop') : undefined}
          className="inline-flex items-center gap-2 font-body text-[10px] tracking-[0.22em] uppercase text-sepia-mid hover:text-ink transition-colors duration-300 cursor-pointer px-4 py-2 rounded-full border border-warm-gray/20 hover:border-warm-gray/40"
        >
          &larr;{' '}
          {isImpactProductDetail
            ? t('shop.detail.backToImpactShop')
            : t('shop.detail.backToShop')}
        </Link>
      </SectionContainer>
    </PageWrapper>
  );
}
