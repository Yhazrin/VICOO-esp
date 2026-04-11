import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';

import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import TraceabilityTimeline from '@/components/editorial/TraceabilityTimeline';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import { useCartStore } from '@/stores/cartStore';
import { productsApi } from '@/services/products';
import { supplyChainApi } from '@/services/supply-chain';
import { reviewsApi } from '@/services/reviewsApi';
import { useAuthStore } from '@/stores/authStore';

function ThumbnailButton({
  url,
  index,
  selected,
  onSelect,
  label,
}: {
  url: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
  label: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      onClick={onSelect}
      aria-label={label + (index + 1)}
      className={`w-16 h-16 overflow-hidden border-2 transition-colors relative cursor-pointer ${
        selected ? 'border-ink' : 'border-transparent'
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
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const prefersReducedMotion = useReducedMotion();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');

  const { data: product, isLoading: loading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
    retry: false,
  });

  const { data: linkedArtwork } = useQuery({
    queryKey: ['product-artwork', id],
    queryFn: () => productsApi.getArtwork(id!),
    enabled: !!id && !!product?.artworkId,
    retry: false,
  });

  const { data: supplyChainRecords = [] } = useQuery({
    queryKey: ['product-supply-chain', id],
    queryFn: () => supplyChainApi.getProductJourney(id!),
    enabled: !!id,
    retry: false,
  });

  const { data: reviewsResult } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewsApi.listByProduct(Number(id)),
    enabled: !!id,
    retry: false,
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        product_id: Number(id),
        rating: reviewRating,
        title: reviewTitle || undefined,
        body: reviewBody || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', id] });
      setReviewTitle('');
      setReviewBody('');
    },
  });

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const addedTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current);
    };
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, selectedSize || undefined, selectedColor || undefined);
    setAdded(true);
    setCartOpen(true);
    if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current);
    addedTimeoutRef.current = setTimeout(() => setAdded(false), 2000);
  };

  if (loading || !product) {
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

  const productImages = product.image_url ? [product.image_url] : [];
  const totalCarbon = supplyChainRecords.reduce(
    (sum, r) => sum + (Number((r as Record<string, unknown>).carbonFootprint) || 0),
    0
  );

  const safeProduct = {
    name: product.name ?? '',
    description: product.description ?? '',
    category: product.category ?? '',
    price: product.price ?? 0,
    currency: product.currency ?? 'CNY',
    inStock: product.inStock ?? true,
    sustainabilityScore: product.sustainabilityScore ?? 0,
    image_url: product.image_url ?? '',
    sizes: product.sizes ?? undefined,
    colors: product.colors ?? undefined,
  };

  return (
    <PageWrapper>
      {/* Product section */}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
            {/* Images */}
            <div className="md:col-span-6">
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <SepiaImageFrame
                  src={productImages[selectedImage]}
                  alt={safeProduct.name}
                  aspectRatio="portrait"
                  size="full"
                />
              </motion.div>
              {productImages.length > 1 && (
                <div className="flex gap-3 mt-4">
                  {productImages.map((url, index) => (
                    <ThumbnailButton
                      key={url}
                      url={url}
                      index={index}
                      selected={selectedImage === index}
                      onSelect={() => setSelectedImage(index)}
                      label={t('shop.detail.viewImage', '查看图片')}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="md:col-span-5 md:col-start-8">
              <p className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid mb-2">
                {safeProduct.category}
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-ink font-bold leading-tight mb-4">
                {safeProduct.name}
              </h1>
              <p className="font-display text-2xl text-ink mb-6">
                {safeProduct.currency} {Number(safeProduct.price).toFixed(2)}
              </p>
              <p className="font-body text-body-sm text-ink-faded leading-[1.8] mb-8">
                {safeProduct.description}
              </p>

              {/* Artwork source */}
              {linkedArtwork && (
                <div className="border border-warm-gray/30 p-4 mb-8">
                  <p className="font-body text-caption text-sepia-mid tracking-wider uppercase mb-1">
                    {t('shop.detail.artwork')} {linkedArtwork.artist_name || linkedArtwork.title}
                  </p>
                  <p className="font-body text-caption text-ink-faded">
                    {linkedArtwork.title}
                  </p>
                </div>
              )}

              {/* Size selector */}
              {safeProduct.sizes && safeProduct.sizes.length > 0 && (
                <div className="mb-6">
                  <p className="font-body text-caption tracking-wider uppercase text-sepia-mid mb-3">
                    {t('shop.detail.size', 'Size')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {safeProduct.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                        className={`
                          min-w-[44px] h-10 px-3 font-mono text-xs flex items-center justify-center transition-all duration-200 cursor-pointer
                          ${selectedSize === size
                            ? 'bg-ink text-paper border border-ink'
                            : 'bg-transparent text-ink border border-warm-gray/30 hover:border-warm-gray/60'
                          }
                        `}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color selector */}
              {safeProduct.colors && safeProduct.colors.length > 0 && (
                <div className="mb-6">
                  <p className="font-body text-caption tracking-wider uppercase text-sepia-mid mb-3">
                    {t('shop.detail.color', 'Color')}
                    {selectedColor && (
                      <span className="text-ink ml-2 normal-case">{selectedColor}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {safeProduct.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(selectedColor === color.name ? '' : color.name)}
                        className={`
                          w-9 h-9 rounded-full border-2 transition-all duration-200 cursor-pointer
                          ${selectedColor === color.name
                            ? 'border-ink scale-110'
                            : 'border-warm-gray/30 hover:border-warm-gray/60'
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

              {/* Sustainability score */}
              <div className="mb-8">
                <p className="font-body text-caption tracking-wider uppercase text-sepia-mid mb-2">
                  {t('shop.detail.sustainability')}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-4 h-4 rounded-sm ${
                          level <= safeProduct.sustainabilityScore / 20
                            ? 'bg-archive-brown'
                            : 'bg-warm-gray/40'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-body text-caption text-sepia-mid">
                    {safeProduct.sustainabilityScore}/100
                  </span>
                </div>
              </div>

              {/* Quantity + Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <label className="font-body text-caption tracking-wider uppercase text-sepia-mid">
                  {t('shop.detail.quantity')}
                </label>
                <div className="flex items-center border border-warm-gray/50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="min-w-[44px] min-h-[44px] px-3 py-2 text-ink hover:bg-warm-gray/20 transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-body text-body-sm px-4 py-2 text-ink" aria-live="polite">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="min-w-[44px] min-h-[44px] px-3 py-2 text-ink hover:bg-warm-gray/20 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={!safeProduct.inStock}
                  className={`flex-1 font-body text-body-sm tracking-[0.15em] uppercase py-4 transition-all duration-300 ${
                    added
                      ? 'bg-archive-brown text-paper'
                      : safeProduct.inStock
                        ? 'bg-ink text-paper hover:bg-ink-faded cursor-pointer'
                        : 'bg-warm-gray text-ink-faded cursor-not-allowed'
                  }`}
                >
                  {!safeProduct.inStock
                    ? t('shop.card.soldOut')
                    : added
                      ? t('shop.detail.added') + ' \u2713'
                      : t('shop.detail.addToCart')}
                </motion.button>
              </div>
            </div>
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      {/* Supply Chain Journey */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24">
        <SectionContainer>
          <h2 className="font-display text-h3 font-bold text-ink mb-8">
            {t('shop.detail.supplyChain')}
          </h2>
          <p className="font-body text-body-sm text-ink-faded mt-2 mb-8">
            {`Total carbon footprint: ${totalCarbon.toFixed(1)} kg CO\u2082e \u00b7 Offset via verified programs`}
          </p>
          <TraceabilityTimeline records={supplyChainRecords} />
        </SectionContainer>
      </PaperTextureBackground>

      {/* Reviews */}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24">
        <SectionContainer>
          <h2 className="font-display text-h3 font-bold text-ink mb-8">
            {t('shop.detail.reviews', '评价')}
          </h2>
          <ul className="space-y-4 mb-10">
            {(reviewsResult?.data ?? []).length === 0 && (
              <li className="font-body text-caption text-ink-faded">{t('shop.detail.noReviews', '暂无评价')}</li>
            )}
            {(reviewsResult?.data ?? []).map((r) => (
              <li key={r.id} className="border border-warm-gray/25 p-4 bg-paper/60">
                <p className="font-body text-overline text-sepia-mid">
                  {t('shop.detail.rating', '评分')} {r.rating}/5 · {r.created_at?.slice(0, 10)}
                </p>
                {r.title && <p className="font-display text-lg text-ink mt-1">{r.title}</p>}
                {r.body && <p className="font-body text-body-sm text-ink-faded mt-2">{r.body}</p>}
              </li>
            ))}
          </ul>
          {isAuthenticated && (
            <form
              className="max-w-lg border border-warm-gray/30 p-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                reviewMutation.mutate();
              }}
            >
              <p className="font-body text-overline text-sepia-mid">{t('shop.detail.writeReview', '撰写评价')}</p>
              <label className="font-body text-caption text-ink-faded block">
                {t('shop.detail.rating', '评分')}
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full mt-2"
                />
              </label>
              <input
                className="w-full border-b border-warm-gray/50 bg-transparent py-2 font-body text-body-sm text-ink"
                placeholder={t('shop.detail.reviewTitle', '标题（可选）')}
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
              />
              <textarea
                className="w-full border border-warm-gray/40 bg-transparent p-3 font-body text-body-sm text-ink min-h-[100px]"
                placeholder={t('shop.detail.reviewBody', '分享穿着或包装体验')}
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
              />
              {reviewMutation.isError && (
                <p className="text-rust font-body text-caption" role="alert">
                  {t('shop.detail.reviewError', '您可能已评价过该商品')}
                </p>
              )}
              <button
                type="submit"
                disabled={reviewMutation.isPending}
                className="font-body text-overline tracking-[0.2em] uppercase bg-ink text-paper px-6 py-3 hover:bg-rust cursor-pointer disabled:opacity-50"
              >
                {reviewMutation.isPending ? t('common.loading', '…') : t('shop.detail.submitReview', '提交')}
              </button>
            </form>
          )}
        </SectionContainer>
      </PaperTextureBackground>

      {/* Back link */}
      <SectionContainer className="py-8">
        <Link
          to="/shop"
          className="font-body text-caption tracking-[0.15em] uppercase text-ink-faded hover:text-rust transition-colors cursor-pointer"
        >
          &larr; {t('common.back')} to shop
        </Link>
      </SectionContainer>
    </PageWrapper>
  );
}
