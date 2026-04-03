import { useState, useMemo, useCallback } from 'react';
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

export default function Shop() {
  const { t } = useTranslation();

  const MOCK_PRODUCTS: Product[] = [
    {
      id: 1,
      name: t('shop.mock.product1.name'),
      description: t('shop.mock.product1.description'),
      price: 298,
      currency: 'CNY',
      image_url: 'https://picsum.photos/seed/dreamscape-tee/600/800',
      category: 'apparel',
      inStock: true,
      stockCount: 24,
      sustainabilityScore: 87,
      supplyChain: [],
      artworkBy: { childName: t('shop.mock.product1.childName'), age: 8, campaign: t('shop.mock.product1.campaign') },
    },
    {
      id: 2,
      name: t('shop.mock.product2.name'),
      description: t('shop.mock.product2.description'),
      price: 168,
      currency: 'CNY',
      image_url: 'https://picsum.photos/seed/bloom-tote/600/800',
      category: 'accessories',
      inStock: true,
      stockCount: 3,
      sustainabilityScore: 92,
      supplyChain: [],
      artworkBy: { childName: t('shop.mock.product2.childName'), age: 7, campaign: t('shop.mock.product2.campaign') },
    },
    {
      id: 3,
      name: t('shop.mock.product3.name'),
      description: t('shop.mock.product3.description'),
      price: 58,
      currency: 'CNY',
      image_url: 'https://picsum.photos/seed/sketchbook/600/800',
      category: 'stationery',
      inStock: true,
      stockCount: 156,
      sustainabilityScore: 95,
      supplyChain: [],
      artworkBy: { childName: t('shop.mock.product3.childName'), age: 6, campaign: t('shop.mock.product3.campaign') },
    },
    {
      id: 4,
      name: t('shop.mock.product4.name'),
      description: t('shop.mock.product4.description'),
      price: 128,
      currency: 'CNY',
      image_url: 'https://picsum.photos/seed/ocean-print/600/800',
      category: 'prints',
      inStock: true,
      stockCount: 42,
      sustainabilityScore: 88,
      supplyChain: [],
      artworkBy: { childName: t('shop.mock.product4.childName'), age: 9, campaign: t('shop.mock.product4.campaign') },
    },
    {
      id: 5,
      name: t('shop.mock.product5.name'),
      description: t('shop.mock.product5.description'),
      price: 458,
      currency: 'CNY',
      image_url: 'https://picsum.photos/seed/cityscape-hoodie/600/800',
      category: 'apparel',
      inStock: false,
      stockCount: 0,
      sustainabilityScore: 84,
      supplyChain: [],
      artworkBy: { childName: t('shop.mock.product5.childName'), age: 10, campaign: t('shop.mock.product5.campaign') },
    },
    {
      id: 6,
      name: t('shop.mock.product6.name'),
      description: t('shop.mock.product6.description'),
      price: 48,
      currency: 'CNY',
      image_url: 'https://picsum.photos/seed/rainbow-pins/600/800',
      category: 'accessories',
      inStock: true,
      stockCount: 89,
      sustainabilityScore: 90,
      supplyChain: [],
      artworkBy: { childName: t('shop.mock.product6.childName'), age: 8, campaign: t('shop.mock.product6.campaign') },
    },
  ];
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
  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      try {
        return await productsApi.getCategories();
      } catch {
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  const categories: Category[] = useMemo(() => {
    const fromApi = (categoriesData ?? [])
      .filter((c): c is Category => ['apparel', 'accessories', 'stationery', 'prints'].includes(c))
      .filter((c, i, arr) => arr.indexOf(c) === i);
    const fallback: Category[] = ['apparel', 'accessories', 'stationery', 'prints'];
    return ['all', ...(fromApi.length ? fromApi : fallback)];
  }, [categoriesData]);

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, cat: Category) => {
      const idx = categories.indexOf(cat);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = categories[(idx + 1) % categories.length];
        setActiveCategory(next);
        document.getElementById(`shop-tab-${next}`)?.focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = categories[(idx - 1 + categories.length) % categories.length];
        setActiveCategory(prev);
        document.getElementById(`shop-tab-${prev}`)?.focus();
      }
    },
    [],
  );

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
      <h1 className="sr-only">{t('shop.hero.title')}</h1>
      <EditorialHero
        title={t('shop.hero.title')}
        subtitle={t('shop.hero.subtitle')}
        hideHero={true}
      />

      <SectionContainer noTopSpacing>
        <NumberedSectionHeading number="01" title={t('shop.collection')} />

        {/* Filters and sort row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          {/* Category filter */}
          <div className="flex items-center gap-1 border-b border-warm-gray/30 overflow-x-auto flex-1" role="tablist">
            {categories.map((cat, index) => (
              <motion.button
                key={cat}
                id={`shop-tab-${cat}`}
                role="tab"
                aria-selected={activeCategory === cat}
                aria-controls={`shop-panel-${cat}`}
                tabIndex={activeCategory === cat ? 0 : -1}
                onClick={() => setActiveCategory(cat)}
                onKeyDown={(e) => handleTabKeyDown(e, cat)}
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
        <div
          role="tabpanel"
          id={`shop-panel-${activeCategory}`}
          aria-labelledby={`shop-tab-${activeCategory}`}
        >
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
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

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
                {t('shop.sustainability.certifiedMaterials')}
              </h4>
              <p className="font-body text-body-sm text-ink-faded leading-relaxed max-w-[48ch]">
                {t('shop.sustainability.certifiedMaterialsDesc')}
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
                  {t('shop.sustainability.ethicalProduction')}
                </h4>
                <p className="font-body text-caption text-ink-faded leading-relaxed">
                  {t('shop.sustainability.ethicalProductionDesc')}
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
                  {t('shop.sustainability.carbonMeasured')}
                </h4>
                <p className="font-body text-caption text-ink-faded leading-relaxed">
                  {t('shop.sustainability.carbonMeasuredDesc')}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Behind the Collection */}
      <SectionContainer>
        <NumberedSectionHeading number="02" title={t('shop.behindCollection')} />

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
              alt={t('shop.workshop.imageAlt')}
              caption={t('shop.workshop.imageCaption')}
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
              {t('shop.editorial.paragraph1')}
            </p>
            <p className="font-body text-caption text-ink-faded leading-relaxed mb-6">
              {t('shop.editorial.paragraph2')}
            </p>

            <StoryQuoteBlock
              quote={t('shop.quote.text')}
              author={t('shop.quote.author')}
              role={t('shop.quote.role')}
            />
          </motion.div>
        </div>
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
