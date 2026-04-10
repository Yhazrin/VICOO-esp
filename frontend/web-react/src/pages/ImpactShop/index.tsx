import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import ProductCard from '@/components/editorial/ProductCard';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { productsApi } from '@/services/products';
import { campaignsApi } from '@/services/campaigns';
import type { Campaign } from '@/types';

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
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [activeCampaignId, setActiveCampaignId] = useState<number | 'all'>('all');

  // Fetch impact products
  const { data } = useQuery({
    queryKey: ['products', { category: activeCategory, isImpactProduct: true }],
    queryFn: async () => {
      const result = await productsApi.getAll({
        category: activeCategory === 'all' ? undefined : activeCategory,
        isImpactProduct: true,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch campaigns for filter
  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: async () => {
      const result = await campaignsApi.getAll();
      return result;
    },
    staleTime: 10 * 60 * 1000,
  });

  const campaigns: Campaign[] = useMemo(() => {
    return campaignsData?.items ?? [];
  }, [campaignsData]);

  const filtered = useMemo(() => {
    let list = data?.items ?? [];
    if (activeCampaignId !== 'all') {
      list = list.filter((p) => p.campaignId === activeCampaignId);
    }
    return list;
  }, [data, activeCampaignId]);

  const categories: Category[] = useMemo(() => {
    const items = data?.items ?? [];
    const cats = new Set(items.map((p) => p.category));
    return ['all', ...Array.from(cats)] as Category[];
  }, [data]);

  const clearFilters = () => {
    setActiveCategory('all');
    setActiveCampaignId('all');
  };

  const hasFilters = activeCategory !== 'all' || activeCampaignId !== 'all';

  return (
    <PageWrapper>
      {/* ═══ Hero Section ═══ */}
      <SectionContainer noTopSpacing>
        <div className="pt-6 pb-10">
          <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-2">
            {t('impactShop.collection')}
          </span>
          <h1 className="font-display text-[clamp(28px,4vw,48px)] font-bold text-ink leading-[1.05] tracking-[-0.02em] mb-3">
            {t('impactShop.hero.title')}
          </h1>
          <p className="font-body text-body text-ink-faded leading-[1.7] max-w-2xl">
            {t('impactShop.hero.subtitle')}
          </p>
        </div>
      </SectionContainer>

      {/* ═══ Product Grid Section ═══ */}
      <SectionContainer>
        <div className="border-t border-warm-gray/20 pt-12">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-8 flex-wrap">
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
          <div className="mb-6">
            <span className="font-body text-caption text-sepia-mid tracking-wider">
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
                  <ProductCard key={product.id} product={product} index={index} />
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
            <ImpactPill label={t('impactShop.impactSummary.childrenHelped')} value="120+" />
            <ImpactPill label={t('impactShop.impactSummary.fundsRaised')} value="¥86K" />
            <ImpactPill label={t('impactShop.impactSummary.artworksTransformed')} value="200+" />
          </div>
        </div>
      </SectionContainer>

      {/* ═══ Traceability CTA ═══ */}
      <SectionContainer>
        <div className="border-t border-warm-gray/20 pt-16 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            <motion.div
              className="md:col-span-7"
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } })}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0, 0, 0.2, 1] }}
            >
              <SepiaImageFrame
                src="https://picsum.photos/seed/vicoo-trace-cta/800/500"
                alt={t('impactShop.cta.title')}
                caption={t('impactShop.cta.subtitle')}
                aspectRatio="wide"
                size="full"
                showCornerAccents={true}
                accentPosition="diagonal"
              />
            </motion.div>

            <motion.div
              className="md:col-span-5 flex flex-col justify-center"
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 } })}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0, 0, 0.2, 1] }}
            >
              <StoryQuoteBlock
                quote={t('impactShop.cta.subtitle')}
                author="VICOO"
                role={t('impactShop.cta.title')}
              />

              <Link
                to="/traceability"
                className="mt-8 inline-flex items-center gap-2 font-body text-label tracking-[0.15em] uppercase text-rust hover:text-rust-light transition-colors cursor-pointer group"
              >
                <span>{t('impactShop.cta.button')}</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
