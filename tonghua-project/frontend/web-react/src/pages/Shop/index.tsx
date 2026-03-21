import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import ProductCard from '@/components/editorial/ProductCard';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import VintageSelect from '@/components/editorial/VintageSelect';
import { productsApi } from '@/services/products';
import type { Product } from '@/types';

type Category = 'all' | 'apparel' | 'accessories' | 'stationery' | 'prints';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'sustainability';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Dreamscape Tee',
    description: 'A children\'s ocean painting transformed into a wearable story.',
    price: 298,
    currency: 'CNY',
    imageUrls: ['https://picsum.photos/seed/dreamscape-tee/600/800'],
    category: 'apparel',
    inStock: true,
    stockCount: 24,
    sustainabilityScore: 87,
    supplyChain: [],
    artworkBy: { childName: 'Xiao Lin', age: 8, campaign: 'Ocean Dreams' },
  },
  {
    id: '2',
    name: 'Bloom Tote Bag',
    description: 'Hand-printed organic cotton tote featuring spring campaign artwork.',
    price: 168,
    currency: 'CNY',
    imageUrls: ['https://picsum.photos/seed/bloom-tote/600/800'],
    category: 'accessories',
    inStock: true,
    stockCount: 3,
    sustainabilityScore: 92,
    supplyChain: [],
    artworkBy: { childName: 'Mei Hua', age: 7, campaign: 'Spring Garden' },
  },
  {
    id: '3',
    name: 'Little Artists Sketchbook',
    description: 'Recycled paper sketchbook with cover art from our winter campaign.',
    price: 58,
    currency: 'CNY',
    imageUrls: ['https://picsum.photos/seed/sketchbook/600/800'],
    category: 'stationery',
    inStock: true,
    stockCount: 156,
    sustainabilityScore: 95,
    supplyChain: [],
    artworkBy: { childName: 'Tong Tong', age: 6, campaign: 'Winter Wonders' },
  },
  {
    id: '4',
    name: 'Ocean Dreams Art Print',
    description: 'Museum-quality giclee print on archival paper.',
    price: 128,
    currency: 'CNY',
    imageUrls: ['https://picsum.photos/seed/ocean-print/600/800'],
    category: 'prints',
    inStock: true,
    stockCount: 42,
    sustainabilityScore: 88,
    supplyChain: [],
    artworkBy: { childName: 'Xiao Yu', age: 9, campaign: 'Ocean Dreams' },
  },
  {
    id: '5',
    name: 'Cityscape Hoodie',
    description: 'Organic cotton hoodie with embroidered children\'s city drawings.',
    price: 458,
    currency: 'CNY',
    imageUrls: ['https://picsum.photos/seed/cityscape-hoodie/600/800'],
    category: 'apparel',
    inStock: false,
    stockCount: 0,
    sustainabilityScore: 84,
    supplyChain: [],
    artworkBy: { childName: 'Jia Wei', age: 10, campaign: 'My City' },
  },
  {
    id: '6',
    name: 'Rainbow Pin Set',
    description: 'Enamel pin set featuring five winning artworks from 2025.',
    price: 48,
    currency: 'CNY',
    imageUrls: ['https://picsum.photos/seed/rainbow-pins/600/800'],
    category: 'accessories',
    inStock: true,
    stockCount: 89,
    sustainabilityScore: 90,
    supplyChain: [],
    artworkBy: { childName: 'An Qi', age: 8, campaign: 'Colors of Hope' },
  },
];

export default function Shop() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const { data } = useQuery({
    queryKey: ['products', { category: activeCategory }],
    queryFn: async () => {
      try {
        const result = await productsApi.getAll({
          category: activeCategory === 'all' ? undefined : activeCategory,
        });
        return result;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories: Category[] = ['all', 'apparel', 'accessories', 'stationery', 'prints'];
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'default', label: t('shop.sort.default') },
    { value: 'price-asc', label: t('shop.sort.priceAsc') },
    { value: 'price-desc', label: t('shop.sort.priceDesc') },
    { value: 'sustainability', label: t('shop.sort.sustainability') },
  ];

  const filtered = useMemo(() => {
    let list = data?.items ?? MOCK_PRODUCTS;

    if (activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory);
    }

    switch (sortBy) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price);
      case 'sustainability':
        return [...list].sort((a, b) => b.sustainabilityScore - a.sustainabilityScore);
      default:
        return list;
    }
  }, [data, activeCategory, sortBy]);

  return (
    <PageWrapper>
      <EditorialHero
        title={t('shop.hero.title')}
        subtitle={t('shop.hero.subtitle')}
        hideHero={true}
      />
      <h1 className="sr-only">{t('shop.hero.title')}</h1>

      <SectionContainer noTopSpacing>
        <NumberedSectionHeading number="01" title="Collection" />

        {/* Filters and sort row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          {/* Category filter */}
          <div className="flex items-center gap-1 border-b border-warm-gray/30 overflow-x-auto flex-1" role="tablist">
            {categories.map((cat, index) => (
              <motion.button
                key={cat}
                role="tab"
                id={`tab-shop-${cat}`}
                aria-selected={activeCategory === cat}
                aria-controls="panel-shop"
                tabIndex={activeCategory === cat ? 0 : -1}
                onClick={() => setActiveCategory(cat)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    const next = categories[(index + 1) % categories.length];
                    setActiveCategory(next);
                    document.getElementById(`tab-shop-${next}`)?.focus();
                  } else if (e.key === 'ArrowLeft') {
                    const prev = categories[(index - 1 + categories.length) % categories.length];
                    setActiveCategory(prev);
                    document.getElementById(`tab-shop-${prev}`)?.focus();
                  }
                }}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                className={`
                  font-body text-caption tracking-[0.15em] uppercase px-4 py-3 transition-all duration-200 border-b-2 -mb-px whitespace-nowrap relative cursor-pointer
                  ${activeCategory === cat
                    ? 'border-rust text-rust'
                    : 'border-transparent text-sepia-mid hover:text-ink'
                  }
                `}
              >
                {t(`shop.filters.${cat}`)}
                {activeCategory === cat && (
                  <motion.span
                    layoutId="category-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px bg-rust"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <VintageSelect
              label={t('shop.sort.label')}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              options={sortOptions}
              className="w-auto"
            />
          </div>
        </div>

        {/* Results count */}
        <p className="font-body text-caption text-sepia-mid mb-8 tracking-wider">
          {t('shop.results', { count: filtered.length })}
        </p>

        {/* Product grid */}
        <div role="tabpanel" id="panel-shop" aria-labelledby={`tab-shop-${activeCategory}`}>
        {filtered.length === 0 ? (
          <p className="font-body text-body-sm text-sepia-mid py-20 text-center">
            {t('shop.empty')}
          </p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCategory}-${sortBy}`}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-14"
            >
              {filtered.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
        </div>
      </SectionContainer>

      {/* Sustainability note */}
      <SectionContainer>
        <div className="border-t border-warm-gray/30 pt-12 mt-8 relative">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-rust/30 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-rust/30 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {/* Left: Lead pillar — wider, more emphasis */}
            <motion.div
              className="md:col-span-7 md:border-r border-warm-gray/30 md:pr-12"
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } })}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
            >
              <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
                01
              </span>
              <h4 className="font-display text-h3 font-bold text-ink mt-3 mb-3">
                Certified Materials
              </h4>
              <p className="font-body text-body-sm text-ink-faded leading-relaxed max-w-[48ch]">
                All fabrics are GOTS-certified organic cotton or recycled polyester.
                Every material is traced back to its source, with certificates verified
                by independent auditors before entering our supply chain.
              </p>
            </motion.div>

            {/* Right: Secondary pillars stacked */}
            <div className="md:col-span-5 flex flex-col gap-8">
              <motion.div
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 } })}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0, 0, 0.2, 1] }}
              >
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
                  02
                </span>
                <h4 className="font-display text-lg font-bold text-ink mt-2 mb-2">
                  Ethical Production
                </h4>
                <p className="font-body text-caption text-ink-faded leading-relaxed">
                  Fair wages, safe conditions, full supply chain transparency.
                </p>
              </motion.div>

              <div className="h-px bg-warm-gray/30" />

              <motion.div
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 } })}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0, 0, 0.2, 1] }}
              >
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
                  03
                </span>
                <h4 className="font-display text-lg font-bold text-ink mt-2 mb-2">
                  Carbon Measured
                </h4>
                <p className="font-body text-caption text-ink-faded leading-relaxed">
                  Every product's carbon footprint is calculated and offset.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Behind the Collection */}
      <SectionContainer>
        <NumberedSectionHeading number="02" title="Behind the Collection" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mt-10">
          {/* Left: Workshop image — 8/12 columns */}
          <motion.div
            className="md:col-span-8"
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: -30 }, whileInView: { opacity: 1, x: 0 } })}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0, 0, 0.2, 1] }}
          >
            <SepiaImageFrame
              src="https://picsum.photos/seed/vicoo-workshop-art/800/500"
              alt="Children creating artwork in a VICOO workshop"
              caption="A Saturday morning workshop in Chengdu, where children paint the dreams that will become our next collection."
              aspectRatio="wide"
              size="full"
              showCornerAccents={true}
              accentPosition="diagonal"
            />
          </motion.div>

          {/* Right: Editorial text — 4/12 columns */}
          <motion.div
            className="md:col-span-4 flex flex-col justify-center"
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: 30 }, whileInView: { opacity: 1, x: 0 } })}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0, 0, 0.2, 1] }}
          >
            <p className="font-body text-caption text-ink-faded leading-relaxed mb-4">
              Every garment in this collection begins the same way -- with a child,
              a blank page, and the freedom to imagine. We partner with schools and
              community centres across twelve cities, running workshops where children
              draw their hopes for the world.
            </p>
            <p className="font-body text-caption text-ink-faded leading-relaxed mb-6">
              Our designers then translate these raw, honest artworks into patterns,
              prints, and embroideries -- never altering the child's original vision.
              The result is clothing that carries real stories, not manufactured ones.
            </p>

            <StoryQuoteBlock
              quote="I drew the ocean because I want it to stay blue forever."
              author="Xiao Lin"
              role="Age 8, Ocean Dreams campaign"
            />
          </motion.div>
        </div>
      </SectionContainer>

      <div className="editorial-divider" aria-hidden="true" />
    </PageWrapper>
  );
}
