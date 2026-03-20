import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import ProductCard from '@/components/editorial/ProductCard';
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
    imageUrls: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80'],
    category: 'apparel',
    inStock: true,
    stockCount: 24,
    sustainabilityScore: 87,
    supplyChain: [],
  },
  {
    id: '2',
    name: 'Bloom Tote Bag',
    description: 'Hand-printed organic cotton tote featuring spring campaign artwork.',
    price: 168,
    currency: 'CNY',
    imageUrls: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80'],
    category: 'accessories',
    inStock: true,
    stockCount: 3,
    sustainabilityScore: 92,
    supplyChain: [],
  },
  {
    id: '3',
    name: 'Little Artists Sketchbook',
    description: 'Recycled paper sketchbook with cover art from our winter campaign.',
    price: 58,
    currency: 'CNY',
    imageUrls: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&q=80'],
    category: 'stationery',
    inStock: true,
    stockCount: 156,
    sustainabilityScore: 95,
    supplyChain: [],
  },
  {
    id: '4',
    name: 'Ocean Dreams Art Print',
    description: 'Museum-quality giclee print on archival paper.',
    price: 128,
    currency: 'CNY',
    imageUrls: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80'],
    category: 'prints',
    inStock: true,
    stockCount: 42,
    sustainabilityScore: 88,
    supplyChain: [],
  },
  {
    id: '5',
    name: 'Cityscape Hoodie',
    description: 'Organic cotton hoodie with embroidered children\'s city drawings.',
    price: 458,
    currency: 'CNY',
    imageUrls: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80'],
    category: 'apparel',
    inStock: false,
    stockCount: 0,
    sustainabilityScore: 84,
    supplyChain: [],
  },
  {
    id: '6',
    name: 'Rainbow Pin Set',
    description: 'Enamel pin set featuring five winning artworks from 2025.',
    price: 48,
    currency: 'CNY',
    imageUrls: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80'],
    category: 'accessories',
    inStock: true,
    stockCount: 89,
    sustainabilityScore: 90,
    supplyChain: [],
  },
];

export default function Shop() {
  const { t } = useTranslation();
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
        number="06"
        title={t('shop.hero.title')}
        subtitle={t('shop.hero.subtitle')}
        hideHero={true}
      />

      <SectionContainer noTopSpacing>
        <NumberedSectionHeading number="01" title="Collection" />

        {/* Filters and sort row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          {/* Category filter */}
          <div className="flex items-center gap-1 border-b border-warm-gray/30 overflow-x-auto flex-1">
            {categories.map((cat, index) => (
              <motion.button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className={`
                  font-body text-xs tracking-[0.15em] uppercase px-4 py-3 transition-all duration-200 border-b-2 -mb-px whitespace-nowrap relative
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
        {filtered.length === 0 ? (
          <p className="font-body text-sm text-sepia-mid py-20 text-center">
            {t('shop.empty')}
          </p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCategory}-${sortBy}`}
              initial={{ opacity: 0 }}
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
      </SectionContainer>

      {/* Sustainability note */}
      <SectionContainer>
        <div className="border-t border-warm-gray/30 pt-12 mt-8 relative">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-rust/30 pointer-events-none" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-rust/30 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
                01
              </span>
              <h4 className="font-display text-lg font-bold text-ink mt-2 mb-2">
                Certified Materials
              </h4>
              <p className="font-body text-xs text-ink-faded leading-relaxed">
                All fabrics are GOTS-certified organic cotton or recycled polyester.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
                02
              </span>
              <h4 className="font-display text-lg font-bold text-ink mt-2 mb-2">
                Ethical Production
              </h4>
              <p className="font-body text-xs text-ink-faded leading-relaxed">
                Fair wages, safe conditions, full supply chain transparency.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
                03
              </span>
              <h4 className="font-display text-lg font-bold text-ink mt-2 mb-2">
                Carbon Measured
              </h4>
              <p className="font-body text-xs text-ink-faded leading-relaxed">
                Every product's carbon footprint is calculated and offset.
              </p>
            </motion.div>
          </div>
        </div>
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
