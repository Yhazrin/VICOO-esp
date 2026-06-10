import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import ProductCard from '@/components/editorial/ProductCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { productsApi } from '@/services/products';
import { campaignsApi } from '@/services/campaigns';
import { donationsApi } from '@/services/donations';
import { artworksApi } from '@/services/artworks';
import type { Campaign, Product } from '@/types';
import { matchesProductSearch } from '@/utils/productSearch';

type Category = 'all' | 'apparel' | 'accessories' | 'stationery' | 'prints' | 'lifestyle' | 'footwear' | 'home' | 'gift_box';

/* ─── Empty State ─── */

function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-24"
    >
      <div className="w-16 h-16 mx-auto mb-6 border border-warm-gray/20 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-warm-gray/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-display text-lg text-ink-faded mb-2">
        {t('impactShop.empty')}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="font-body text-caption text-rust hover:text-rust-light transition-colors cursor-pointer mt-2 underline underline-offset-4 decoration-rust/30"
        >
          {t('shop.filters.clearAll')}
        </button>
      )}
    </motion.div>
  );
}

/* ─── Impact Counter Pill ─── */

function ImpactPill({ label, value }: { label: string; value: string }) {
  const prefersReducedMotion = useReducedMotion();
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
      animate={prefersReducedMotion ? (isVisible ? { opacity: 1 } : {}) : (isVisible ? { opacity: 1, scale: 1 } : {})}
      transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
      className="text-center"
    >
      <p className="font-display text-h3 md:text-h2 font-bold text-ink leading-[0.95]">{value}</p>
      <p className="font-body text-overline tracking-[0.12em] uppercase text-sepia-mid mt-1">{label}</p>
    </motion.div>
  );
}

/* ─── Impact Shop Page ─── */

export default function ImpactShop() {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.trim() ?? '';
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [activeCampaignId, setActiveCampaignId] = useState<number | 'all'>('all');

  // Fetch ALL impact products by walking pages (backend caps page_size at 100,
// but the impact store has no pagination UI, so we need every record).
const PAGE_SIZE = 100;

async function fetchAllImpactProducts(
  category: Category | undefined,
  locale: string,
): Promise<Product[]> {
  const items: Product[] = [];
  let page = 1;
  // Hard cap at 50 pages (5000 items) to avoid infinite loop on bad data
  while (page <= 50) {
    const result = await productsApi.getAll({
      category,
      isImpactProduct: true,
      locale,
      page,
      page_size: PAGE_SIZE,
    });
    items.push(...result.items);
    if (items.length >= result.total || result.items.length === 0) break;
    page += 1;
  }
  return items;
}

// Fetch impact products
const { data, isLoading, error: productsError } = useQuery({
  queryKey: ['products', 'impact', { category: activeCategory, isImpactProduct: true, locale: i18n.language }],
  queryFn: () => fetchAllImpactProducts(
    activeCategory === 'all' ? undefined : activeCategory,
    i18n.language,
  ),
  staleTime: 5 * 60 * 1000,
});

/** 公益商店：仅展示公益属性商品（与优衣库常规店目录分离） */
const impactItems = useMemo(
  () => (data ?? []).filter((p) => p.isImpactProduct),
  [data]
);


  // Fetch campaigns for filter
  const { data: campaignsData, isError: _campaignsError } = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: async () => {
      const result = await campaignsApi.getAll();
      return result;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch live impact stats
  const { data: impactStats, isError: _impactStatsError } = useQuery({
    queryKey: ['impact-shop-stats'],
    queryFn: async () => {
      const [stats, artworks] = await Promise.all([
        donationsApi.getImpactStats(),
        artworksApi.getAll({ page_size: 1 }),
      ]);
      return {
        totalDonations: Number(stats.total_amount ?? 0),
        totalDonors: stats.total_donors ?? 0,
        totalArtworks: artworks.total ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const campaigns: Campaign[] = useMemo(() => {
    return campaignsData?.items ?? [];
  }, [campaignsData]);

  const filtered = useMemo(() => {
    let list = impactItems;
    if (searchQuery) {
      list = list.filter((p) => matchesProductSearch(p, searchQuery));
    }
    if (activeCampaignId !== 'all') {
      list = list.filter((p) => p.campaignId === activeCampaignId);
    }
    return list;
  }, [impactItems, activeCampaignId, searchQuery]);

  const categories: Category[] = useMemo(() => {
    const cats = new Set(impactItems.map((p) => p.category));
    return ['all', ...Array.from(cats)] as Category[];
  }, [impactItems]);

  const clearFilters = () => {
    setActiveCategory('all');
    setActiveCampaignId('all');
  };

  const hasFilters = activeCategory !== 'all' || activeCampaignId !== 'all' || Boolean(searchQuery);

  return (
    <PageWrapper>
      <SectionContainer noTopSpacing className="!pb-10 md:!pb-14">
        <header className="pt-4 pb-5 md:pb-6 border-b border-warm-gray/15">
          <h1 className="font-display text-[clamp(1.35rem,3.2vw,2.25rem)] font-semibold text-ink leading-[1.08] tracking-[-0.02em]">
            {t('impactShop.hero.title')}
          </h1>
          <p className="font-body text-sm md:text-body-sm text-ink-faded leading-[1.75] max-w-2xl mt-2.5">
            {t('impactShop.hero.subtitle')}
          </p>
        </header>

        <div className="pt-6 md:pt-8">
          {productsError && (
            <div className="flex items-center gap-3 bg-rust/10 border border-rust/20 px-4 py-3 mb-4">
              <p className="font-body text-body-sm text-rust flex-1">{t('impactShop.loadError', 'Failed to load products — please refresh')}</p>
            </div>
          )}
          {isLoading && (
            <div className="py-16 text-center">
              <p className="font-body text-sepia-mid">{t('impactShop.loading', 'Loading...')}</p>
            </div>
          )}
          {/* Filters */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {/* Category pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    font-body text-label tracking-wide px-4 py-2 transition-all duration-300 cursor-pointer whitespace-nowrap
                    ${activeCategory === cat
                      ? 'text-ink font-medium border-b-2 border-rust'
                      : 'text-ink-faded hover:text-ink'
                    }
                  `}
                >
                  {cat === 'all' ? t('shop.filters.all') : t(`shop.filters.${cat}`)}
                </button>
              ))}
            </div>

            {/* Campaign filter */}
            {campaigns.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-body text-overline text-sepia-mid tracking-wider uppercase hidden sm:block">
                  {t('impactShop.filterByCampaign')}
                </span>
                <select
                  value={activeCampaignId}
                  onChange={(e) => setActiveCampaignId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="
                    appearance-none font-body text-label tracking-wide
                    bg-transparent border border-warm-gray/30
                    px-4 py-2 pr-8 cursor-pointer
                    text-ink-faded hover:text-ink hover:border-warm-gray/50
                    focus:outline-none focus:border-rust/50
                    transition-all
                  "
                >
                  <option value="all">{t('impactShop.allCampaigns')}</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="mb-4">
            <span className="font-body text-[11px] text-sepia-mid tracking-wider uppercase">
              {t('impactShop.results', { count: filtered.length })}
            </span>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <EmptyState onClear={clearFilters} hasFilters={hasFilters} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCategory}-${activeCampaignId}`}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 md:gap-x-6 md:gap-y-12"
              >
                {filtered.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} detailContext="impact" />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </SectionContainer>

      {/* ═══ Impact Summary ═══ */}
      <SectionContainer>
        <div className="border-t border-warm-gray/20 pt-16 pb-8">
          <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-10 text-center">
            {t('impactShop.impactSummary.title')}
          </span>
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <ImpactPill label={t('impactShop.impactSummary.childrenHelped')} value={impactStats ? `${impactStats.totalDonors}+` : '--'} />
            <ImpactPill label={t('impactShop.impactSummary.fundsRaised')} value={impactStats ? `¥${Math.round(impactStats.totalDonations / 1000)}K` : '--'} />
            <ImpactPill label={t('impactShop.impactSummary.artworksTransformed')} value={impactStats ? `${impactStats.totalArtworks}+` : '--'} />
          </div>
        </div>
      </SectionContainer>

      {/* ═══ Traceability CTA ═══ */}
      <SectionContainer>
        <div className="border-t border-warm-gray/20 pt-16 pb-16">
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-4">
              {t('impactShop.cta.title', 'Traceability')}
            </span>
            <p className="font-body text-body text-ink-faded leading-[1.7] mb-6">
              {t('impactShop.cta.subtitle', 'Every impact product comes with full supply chain transparency. Track the journey from raw materials to your hands.')}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {['GOTS Certified', 'Fair Trade', 'Carbon Measured', 'Child Safe'].map((badge) => (
                <span
                  key={badge}
                  className="font-body text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border border-warm-gray/25 text-sepia-mid"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
