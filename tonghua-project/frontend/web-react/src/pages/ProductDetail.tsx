import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import TraceabilityTimeline from '@/components/editorial/TraceabilityTimeline';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import { useCartStore } from '@/stores/cartStore';
import type { Product, SupplyChainRecord } from '@/types';

const MOCK_SUPPLY_CHAIN: SupplyChainRecord[] = [
  {
    id: 'sc1',
    stage: 'artwork',
    description: 'Mei, age 8, painted the original design during a workshop in Bijie, Guizhou.',
    location: 'Bijie, Guizhou',
    date: '2025-11-15',
    verified: true,
    partnerName: 'Bijie Community Center',
    carbonFootprint: 0,
  },
  {
    id: 'sc2',
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
    id: 'sc3',
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
    id: 'sc4',
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
    id: 'sc5',
    stage: 'quality',
    description: 'Individually inspected for print clarity, color accuracy, and fabric integrity.',
    location: 'Shanghai',
    date: '2026-02-01',
    verified: true,
    partnerName: 'Tonghua QC',
    carbonFootprint: 0.1,
  },
  {
    id: 'sc6',
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
  id: '1',
  name: "Typhoon Silk Scarf — Mei's Garden",
  description:
    "Hand-printed from 8-year-old Mei's watercolor of a swirling garden. Each scarf is individually printed by artisan Wang Laoshi in her Hangzhou workshop using traditional screen-printing methods. The mulberry silk is sourced from a cooperative in Zhejiang that has been producing silk for six generations. The design preserves Mei's original brushstrokes — the slightly uneven edges, the places where colors bled into each other — because that imperfection is the point.",
  price: 380,
  currency: 'CNY',
  imageUrls: [
    'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop',
  ],
  category: 'accessories',
  inStock: true,
  stockCount: 12,
  sustainabilityScore: 90,
  supplyChain: MOCK_SUPPLY_CHAIN,
};

export default function ProductDetail() {
  const { t } = useTranslation();
  const product = MOCK_PRODUCT;
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const totalCarbon = product.supplyChain.reduce(
    (sum, r) => sum + (r.carbonFootprint ?? 0),
    0
  );

  return (
    <PageWrapper>
      {/* Product section */}
      <PaperTextureBackground variant="paper" className="py-16 md:py-24">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
            {/* Images */}
            <div className="md:col-span-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <SepiaImageFrame
                  src={product.imageUrls[selectedImage]}
                  alt={product.name}
                  aspectRatio="portrait"
                  size="full"
                />
              </motion.div>
              {product.imageUrls.length > 1 && (
                <div className="flex gap-3 mt-4">
                  {product.imageUrls.map((url, index) => {
                    const [thumbLoaded, setThumbLoaded] = useState(false);
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        aria-label={'View image ' + (index + 1)}
                        className={`w-16 h-16 overflow-hidden border-2 transition-colors relative ${
                          selectedImage === index ? 'border-ink' : 'border-transparent'
                        }`}
                      >
                        {!thumbLoaded && <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-square" />}
                        <img
                          src={url}
                          alt=""
                          aria-hidden="true"
                          className={`w-full h-full object-cover ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
                          style={{ filter: 'sepia(0.2) contrast(1.05) brightness(0.97)' }}
                          onLoad={() => setThumbLoaded(true)}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="md:col-span-5 md:col-start-8">
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-sepia-mid mb-2">
                {product.category}
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-ink font-bold leading-tight mb-4">
                {product.name}
              </h1>
              <p className="font-display text-2xl text-ink mb-6">
                {product.currency} {product.price.toFixed(2)}
              </p>
              <p className="font-body text-sm text-ink-faded leading-[1.8] mb-8">
                {product.description}
              </p>

              {/* Artwork source */}
              <div className="border border-warm-gray/30 p-4 mb-8">
                <p className="font-body text-xs text-sepia-mid tracking-wider uppercase mb-1">
                  {t('shop.detail.artwork')} Mei, age 8
                </p>
                <p className="font-body text-xs text-ink-faded">
                  Guizhou Province, November 2025
                </p>
              </div>

              {/* Sustainability score */}
              <div className="mb-8">
                <p className="font-body text-xs tracking-wider uppercase text-sepia-mid mb-2">
                  {t('shop.detail.sustainability')}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-4 h-4 rounded-full ${
                          level <= product.sustainabilityScore / 20
                            ? 'bg-archive-brown'
                            : 'bg-warm-gray/40'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-body text-xs text-sepia-mid">
                    {product.sustainabilityScore}/100
                  </span>
                </div>
              </div>

              {/* Quantity + Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <label className="font-body text-xs tracking-wider uppercase text-sepia-mid">
                  {t('shop.detail.quantity')}
                </label>
                <div className="flex items-center border border-warm-gray/50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="px-3 py-2 text-ink hover:bg-warm-gray/20 transition-colors"
                  >
                    -
                  </button>
                  <span className="font-body text-sm px-4 py-2 text-ink" aria-live="polite">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="px-3 py-2 text-ink hover:bg-warm-gray/20 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`w-full font-body text-sm tracking-[0.15em] uppercase py-4 transition-all duration-300 ${
                  added
                    ? 'bg-archive-brown text-paper'
                    : product.inStock
                      ? 'bg-ink text-paper hover:bg-ink-faded'
                      : 'bg-warm-gray text-ink-faded cursor-not-allowed'
                }`}
              >
                {!product.inStock
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
          <TraceabilityTimeline records={product.supplyChain} />
        </SectionContainer>
      </PaperTextureBackground>

      {/* Back link */}
      <SectionContainer className="py-8">
        <Link
          to="/shop"
          className="font-body text-xs tracking-[0.15em] uppercase text-ink-faded hover:text-rust transition-colors"
        >
          &larr; {t('common.back')} to shop
        </Link>
      </SectionContainer>
    </PageWrapper>
  );
}
