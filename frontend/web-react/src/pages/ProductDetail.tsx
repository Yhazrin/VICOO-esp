import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import TraceabilityTimeline from '@/components/editorial/TraceabilityTimeline';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import { useCartStore } from '@/stores/cartStore';
import { productsApi } from '@/services/products';
import { reviewsApi } from '@/services/reviewsApi';
import { useAuthStore } from '@/stores/authStore';
import type { Product, SupplyChainTimelineRecord } from '@/types';

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

const MOCK_SUPPLY_CHAIN: SupplyChainTimelineRecord[] = [
  {
    id: 1,
    stage: 'artwork',
    description: 'Mei, age 8, painted the original design during a workshop in Bijie, Guizhou.',
    location: 'Bijie, Guizhou',
    date: '2025-11-15',
    verified: true,
    partnerName: 'Bijie Community Center',
    carbonFootprint: 0,
  },
  {
    id: 2,
    stage: 'design',
    description:
      'Our creative team adapted the watercolor for screen printing while preserving brushstroke authenticity.',
    location: 'Shanghai',
    date: '2025-12-01',
    verified: true,
    partnerName: 'Tonghua Creative Team',
    carbonFootprint: 0.2,
  },
  {
    id: 3,
    stage: 'material',
    description:
      '100% mulberry silk sourced from a six-generation cooperative using traditional sericulture methods.',
    location: 'Huzhou, Zhejiang',
    date: '2026-01-10',
    verified: true,
    partnerName: 'Huzhou Silk Cooperative',
    carbonFootprint: 1.8,
  },
  {
    id: 4,
    stage: 'production',
    description:
      'Screen-printed by hand using water-based, non-toxic inks. Each scarf takes 45 minutes to print.',
    location: 'Hangzhou',
    date: '2026-01-20',
    verified: true,
    partnerName: 'Wang Artisan Workshop',
    carbonFootprint: 2.1,
  },
  {
    id: 5,
    stage: 'quality',
    description: 'Individually inspected for print clarity, color accuracy, and fabric integrity.',
    location: 'Shanghai',
    date: '2026-02-01',
    verified: true,
    partnerName: 'Tonghua QC',
    carbonFootprint: 0.1,
  },
  {
    id: 6,
    stage: 'shipping',
    description: 'Packaged in recycled kraft paper. Carbon-offset delivery via SF Express.',
    location: 'Nationwide',
    date: '2026-02-05',
    verified: true,
    partnerName: 'SF Express (Carbon Offset)',
    carbonFootprint: 0.8,
  },
];

const MOCK_PRODUCT: Product = {
  id: 1,
  name: "Typhoon Silk Scarf — Mei's Garden",
  description:
    "Hand-printed from 8-year-old Mei's watercolor of a swirling garden. Each scarf is individually printed by artisan Wang Laoshi in her Hangzhou workshop using traditional screen-printing methods. The mulberry silk is sourced from a cooperative in Zhejiang that has been producing silk for six generations. The design preserves Mei's original brushstrokes — the slightly uneven edges, the places where colors bled into each other — because that imperfection is the point.",
  price: 380,
  currency: 'CNY',
  image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=1000&fit=crop',
  category: 'accessories',
  inStock: true,
  stockCount: 12,
  sustainabilityScore: 90,
  supplyChain: MOCK_SUPPLY_CHAIN,
};

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
    placeholderData: MOCK_PRODUCT,
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
  const addItem = useCartStore((s) => s.addItem);
  const addedTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current);
    };
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    setAdded(true);
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
  const supplyChain = product.supplyChain ?? [];
  const totalCarbon = supplyChain.reduce(
    (sum, r) => sum + (r.carbonFootprint ?? 0),
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
              <div className="border border-warm-gray/30 p-4 mb-8">
                <p className="font-body text-caption text-sepia-mid tracking-wider uppercase mb-1">
                  {t('shop.detail.artwork')} Mei, age 8
                </p>
                <p className="font-body text-caption text-ink-faded">
                  Guizhou Province, November 2025
                </p>
              </div>

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

              <motion.button
                whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={!safeProduct.inStock}
                className={`w-full font-body text-body-sm tracking-[0.15em] uppercase py-4 transition-all duration-300 ${
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
        </SectionContainer>
      </PaperTextureBackground>

      {/* Supply Chain Journey */}
      <PaperTextureBackground variant="aged" className="py-16 md:py-24">
        <SectionContainer>
          <NumberedSectionHeading
            number="01"
            title={t('shop.detail.supplyChain')}
            subtitle={`Total carbon footprint: ${totalCarbon.toFixed(1)} kg CO\u2082e \u00b7 Offset via verified programs`}
          />
          <TraceabilityTimeline records={supplyChain} />
        </SectionContainer>
      </PaperTextureBackground>

      {/* Reviews */}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24">
        <SectionContainer>
          <NumberedSectionHeading number="02" title={t('shop.detail.reviews', '评价')} />
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
