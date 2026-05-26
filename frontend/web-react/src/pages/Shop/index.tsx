import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import ProductCard from '@/components/editorial/ProductCard';
import PromoCard from '@/components/editorial/PromoCard';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import { productsApi } from '@/services/products';
import type { Product } from '@/types';
import { matchesProductSearch } from '@/utils/productSearch';

type Category = 'all' | 'apparel' | 'accessories' | 'stationery' | 'prints' | 'lifestyle' | 'footwear' | 'home' | 'gift_box';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'sustainability';
type SeasonFilter = 'all' | 'spring-summer' | 'fall-winter';
type SustainFilter = 'all' | 'good' | 'excellent' | 'exceptional';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

/** Checkmark contrast on color swatches (dark fills → light stroke) */
function hexNeedsLightForeground(hex: string): boolean {
  const h = hex.replace(/^#/, '');
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return y < 130;
}

const PROMO_INTERVAL = 4;
type PromoVariant = 'story' | 'sustainability' | 'editorial';
const PROMO_VARIANTS: PromoVariant[] = ['story', 'sustainability', 'editorial'];

const sortOptions = (t: (k: string) => string): { value: SortOption; label: string }[] => [
  { value: 'default', label: t('shop.sort.default') },
  { value: 'price-asc', label: t('shop.sort.priceAsc') },
  { value: 'price-desc', label: t('shop.sort.priceDesc') },
  { value: 'sustainability', label: t('shop.sort.sustainability') },
];

// Collapsible filter section component
function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-warm-gray/15 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left cursor-pointer group"
        aria-expanded={open}
      >
        <span className="font-body text-overline tracking-[0.15em] uppercase text-sepia-mid">
          {title}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-warm-gray transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3 5.5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Shop() {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.trim() ?? '';
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sustainFilter, setSustainFilter] = useState<SustainFilter>('all');
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', 'company', { category: activeCategory, isImpactProduct: false, locale: i18n.language }],
    queryFn: async () => {
      const result = await productsApi.getAll({
        category: activeCategory === 'all' ? undefined : activeCategory,
        isImpactProduct: false,
        locale: i18n.language,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  /** 优衣库常规店：仅非公益商品（与公益商店目录完全分离，双保险） */
  const companyItems = useMemo(
    () => (data?.items ?? []).filter((p) => !p.isImpactProduct),
    [data?.items]
  );

  /** 颜色筛选项与接口返回的 SKU 一致（避免写死 6 色与 Olive/Mist 等真实颜色不一致） */
  const filterColorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of companyItems) {
      for (const c of p.colors ?? []) {
        if (c?.name && c.hex && !map.has(c.name)) {
          map.set(c.name, c.hex);
        }
      }
    }
    return Array.from(map.entries())
      .map(([name, hex]) => ({ name, hex }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [companyItems]);

  const categories: Category[] = useMemo(() => {
    const cats = new Set(companyItems.map((p) => p.category));
    const ordered = (
      ['apparel', 'accessories', 'stationery', 'prints', 'lifestyle', 'footwear', 'home', 'gift_box'] as const
    ).filter((c) => cats.has(c));
    return ['all', ...ordered] as Category[];
  }, [companyItems]);

  const priceBounds = useMemo(() => {
    const items = companyItems;
    if (items.length === 0) return { min: 0, max: 5000 };
    const prices = items.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [companyItems]);

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
    [categories],
  );

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (priceRange[0] !== priceBounds.min || priceRange[1] !== priceBounds.max) count++;
    if (selectedSizes.length > 0) count++;
    if (selectedColors.length > 0) count++;
    if (sustainFilter !== 'all') count++;
    if (seasonFilter !== 'all') count++;
    if (activeCategory !== 'all') count++;
    return count;
  }, [priceRange, selectedSizes, selectedColors, sustainFilter, seasonFilter, activeCategory, priceBounds]);

  const clearAllFilters = () => {
    setPriceRange([priceBounds.min, priceBounds.max]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSustainFilter('all');
    setSeasonFilter('all');
    setActiveCategory('all');
  };

  const filtered = useMemo(() => {
    let list = companyItems;

    if (searchQuery) {
      list = list.filter((p) => matchesProductSearch(p, searchQuery));
    }

    if (activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory);
    }

    list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedSizes.length > 0) {
      list = list.filter((p) => p.sizes && p.sizes.some((s) => selectedSizes.includes(s)));
    }

    if (selectedColors.length > 0) {
      list = list.filter((p) => p.colors && p.colors.some((c) => selectedColors.includes(c.name)));
    }

    if (seasonFilter !== 'all') {
      const now = new Date();
      const month = now.getMonth(); // 0-indexed
      const isSpringSummer = month >= 2 && month <= 8; // Mar–Sep
      list = list.filter((p) => {
        // Products without season data pass through
        if (!p.sizes && !p.colors) return true;
        return seasonFilter === 'spring-summer' ? isSpringSummer : !isSpringSummer;
      });
    }

    if (sustainFilter !== 'all') {
      const thresholds: Record<string, number> = { good: 70, excellent: 80, exceptional: 90 };
      const min = thresholds[sustainFilter] ?? 0;
      list = list.filter((p) => (p.sustainabilityScore ?? 0) >= min);
    }

    switch (sortBy) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price);
      case 'sustainability':
        return [...list].sort((a, b) => (b.sustainabilityScore ?? 0) - (a.sustainabilityScore ?? 0));
      default:
        return list;
    }
  }, [companyItems, activeCategory, sortBy, priceRange, sustainFilter, searchQuery, selectedSizes, selectedColors, seasonFilter]);

  const gridItems = useMemo(() => {
    const items: Array<{ type: 'product'; product: Product } | { type: 'promo'; variant: PromoVariant }> = [];
    let promoIndex = 0;
    filtered.forEach((product, i) => {
      items.push({ type: 'product', product });
      if ((i + 1) % PROMO_INTERVAL === 0 && i < filtered.length - 1) {
        items.push({ type: 'promo', variant: PROMO_VARIANTS[promoIndex % PROMO_VARIANTS.length] });
        promoIndex++;
      }
    });
    return items;
  }, [filtered]);

  return (
    <PageWrapper>
      <SectionContainer noTopSpacing>
        {/* Page title + result count */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-2">
              {t('shop.collection')}
            </span>
            <h1 className="font-display text-[clamp(28px,4vw,48px)] font-bold text-ink leading-[1.05] tracking-[-0.02em]">
              {searchQuery
                ? `"${searchQuery}"`
                : activeCategory === 'all'
                  ? t('shop.filters.all')
                  : t(`shop.filters.${activeCategory}`)
              }
            </h1>
            {searchQuery && (
              <p className="font-body text-caption text-sepia-mid mt-1">
                {t('shop.results', { count: filtered.length })}
              </p>
            )}
          </div>
          <span className="font-body text-caption text-sepia-mid tracking-wider hidden sm:block">
            {t('shop.results', { count: filtered.length })}
          </span>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-warm-gray/30 border-t-rust rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="text-center py-24">
            <p className="font-display text-lg text-ink-faded mb-2">
              {t('shop.loadError', 'Failed to load products. Please try again.')}
            </p>
          </div>
        )}

        {!isLoading && !isError && (
        <>
        {/* ═══ Category pills — top level ═══ */}
        <div className="mb-8">
          <div
            className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1"
            role="tablist"
            aria-label="Product categories"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                id={`shop-tab-${cat}`}
                role="tab"
                aria-selected={activeCategory === cat}
                aria-controls={`shop-panel-${cat}`}
                tabIndex={activeCategory === cat ? 0 : -1}
                onClick={() => setActiveCategory(cat)}
                onKeyDown={(e) => handleTabKeyDown(e, cat)}
                className={`
                  relative font-body text-label tracking-wide px-4 py-2 transition-all duration-300 cursor-pointer whitespace-nowrap
                  ${activeCategory === cat
                    ? 'text-ink font-medium'
                    : 'text-ink-faded hover:text-ink'
                  }
                `}
              >
                {t(`shop.filters.${cat}`)}
                {activeCategory === cat && (
                  <motion.div
                    layoutId="shop-category-underline"
                    className="absolute bottom-0 left-2 right-2 h-px bg-rust"
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="h-px bg-warm-gray/20" />
        </div>

        {/* ═══ Filter + Sort control bar ═══ */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          {/* Filter toggle button */}
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`
              flex items-center gap-2 font-body text-label tracking-wide px-4 py-2 border transition-all cursor-pointer
              ${filtersExpanded
                ? 'bg-ink text-paper border-ink'
                : 'border-warm-gray/30 text-ink-faded hover:text-ink hover:border-warm-gray/50'
              }
            `}
            aria-expanded={filtersExpanded}
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2 4h12M5 8h6M7 12h2" strokeLinecap="round" />
            </svg>
            {t('shop.filters.filterButton')}
            {activeFilterCount > 0 && (
              <span className={`
                min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-medium
                ${filtersExpanded ? 'bg-paper text-ink' : 'bg-rust text-paper'}
              `}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="
                appearance-none font-body text-label tracking-wide
                bg-transparent border border-warm-gray/30
                px-4 py-2 pr-8 cursor-pointer
                text-ink-faded hover:text-ink hover:border-warm-gray/50
                focus:outline-none focus:border-rust/50
                transition-all
              "
              aria-label={t('shop.sort.label')}
            >
              {sortOptions(t).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-warm-gray pointer-events-none" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 5.5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <>
              <div className="h-5 w-px bg-warm-gray/20 hidden sm:block" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeCategory !== 'all' && (
                  <FilterChip label={t(`shop.filters.${activeCategory}`)} onRemove={() => setActiveCategory('all')} />
                )}
                {(priceRange[0] !== priceBounds.min || priceRange[1] !== priceBounds.max) && (
                  <FilterChip label={`\u00A5${priceRange[0]}\u2013\u00A5${priceRange[1]}`} onRemove={() => setPriceRange([priceBounds.min, priceBounds.max])} />
                )}
                {selectedSizes.map((size) => (
                  <FilterChip key={size} label={size} onRemove={() => toggleSize(size)} />
                ))}
                {selectedColors.map((color) => (
                  <FilterChip key={color} label={color} onRemove={() => toggleColor(color)} />
                ))}
                {sustainFilter !== 'all' && (
                  <FilterChip
                    label={sustainFilter === 'good' ? '70+' : sustainFilter === 'excellent' ? '80+' : '90+'}
                    onRemove={() => setSustainFilter('all')}
                  />
                )}
                {seasonFilter !== 'all' && (
                  <FilterChip
                    label={seasonFilter === 'spring-summer' ? t('shop.filters.springSummer') : t('shop.filters.fallWinter')}
                    onRemove={() => setSeasonFilter('all')}
                  />
                )}
                <button
                  onClick={clearAllFilters}
                  className="font-body text-[10px] tracking-[0.12em] uppercase text-sepia-mid hover:text-rust transition-colors cursor-pointer ml-1 py-1"
                >
                  {t('shop.filters.clearAll')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ═══ Expandable filter panel ═══ */}
        <AnimatePresence>
          {filtersExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="border border-warm-gray/15 bg-aged-stock/30 p-6 md:p-8 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8">
                  {/* Column 1: Price + Size */}
                  <div>
                    <FilterSection title={t('shop.filters.priceRange')}>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="font-mono text-[10px] text-sepia-mid tracking-wider uppercase block mb-1">Min</label>
                            <input
                              type="number"
                              value={priceRange[0]}
                              min={priceBounds.min}
                              max={priceRange[1]}
                              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                              className="w-full font-mono text-sm bg-transparent border-b border-warm-gray/30 py-1.5 text-ink focus:outline-none focus:border-rust transition-colors"
                              aria-label="Minimum price"
                            />
                          </div>
                          <span className="font-body text-caption text-warm-gray mt-5">&mdash;</span>
                          <div className="flex-1">
                            <label className="font-mono text-[10px] text-sepia-mid tracking-wider uppercase block mb-1">Max</label>
                            <input
                              type="number"
                              value={priceRange[1]}
                              min={priceRange[0]}
                              max={priceBounds.max}
                              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                              className="w-full font-mono text-sm bg-transparent border-b border-warm-gray/30 py-1.5 text-ink focus:outline-none focus:border-rust transition-colors"
                              aria-label="Maximum price"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min={priceBounds.min}
                          max={priceBounds.max}
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="w-full accent-[var(--color-rust)] cursor-pointer"
                          aria-label="Price range slider"
                        />
                      </div>
                    </FilterSection>

                    <FilterSection title={t('shop.filters.size')} defaultOpen={false}>
                      <div className="grid grid-cols-3 gap-2">
                        {SIZES.map((size) => (
                          <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            className={`
                              h-9 flex items-center justify-center font-mono text-xs tracking-wider transition-all cursor-pointer
                              ${selectedSizes.includes(size)
                                ? 'bg-ink text-paper'
                                : 'border border-warm-gray/30 text-ink-faded hover:border-ink hover:text-ink'
                              }
                            `}
                            aria-pressed={selectedSizes.includes(size)}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </FilterSection>
                  </div>

                  {/* Column 2: Color */}
                  <div>
                    <FilterSection title={t('shop.filters.color')}>
                      {filterColorOptions.length === 0 ? (
                        <p className="font-body text-caption text-ink-faded leading-relaxed">
                          {t('shop.filters.noColorData')}
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          {filterColorOptions.map((color) => (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => toggleColor(color.name)}
                              className="flex items-center gap-2.5 py-1 cursor-pointer group/color"
                              aria-pressed={selectedColors.includes(color.name)}
                              aria-label={color.name}
                            >
                              <span
                                className={`
                                w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 flex items-center justify-center
                                ${selectedColors.includes(color.name)
                                  ? 'border-ink scale-110'
                                  : 'border-warm-gray/25 group-hover/color:border-warm-gray/50'
                                }
                              `}
                                style={{ backgroundColor: color.hex }}
                              >
                                {selectedColors.includes(color.name) && (
                                  <svg
                                    className={`w-3 h-3 ${hexNeedsLightForeground(color.hex) ? 'text-paper' : 'text-ink'}`}
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                  >
                                    <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </span>
                              <span className="font-body text-caption text-ink-faded group-hover/color:text-ink transition-colors">
                                {color.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </FilterSection>
                  </div>

                  {/* Column 3: Sustainability */}
                  <div>
                    <FilterSection title={t('shop.filters.sustainability')}>
                      <div className="space-y-2">
                        {([
                          { value: 'all' as SustainFilter, label: t('shop.filters.all'), desc: '' },
                          { value: 'good' as SustainFilter, label: 'Good', desc: '70+' },
                          { value: 'excellent' as SustainFilter, label: 'Excellent', desc: '80+' },
                          { value: 'exceptional' as SustainFilter, label: 'Exceptional', desc: '90+' },
                        ]).map((level) => (
                          <button
                            key={level.value}
                            onClick={() => setSustainFilter(level.value)}
                            className={`
                              w-full flex items-center justify-between px-3 py-2.5 font-body text-caption transition-all cursor-pointer
                              ${sustainFilter === level.value
                                ? 'bg-rust/[0.06] text-ink'
                                : 'text-ink-faded hover:text-ink hover:bg-warm-gray/5'
                              }
                            `}
                            aria-pressed={sustainFilter === level.value}
                          >
                            <span>{level.label}</span>
                            {level.desc && (
                              <span className="font-mono text-[10px] text-sepia-mid">{level.desc}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </FilterSection>
                  </div>

                  {/* Column 4: Season */}
                  <div>
                    <FilterSection title={t('shop.filters.season')}>
                      <div className="space-y-2">
                        {([
                          { value: 'all' as SeasonFilter, label: t('shop.filters.allSeasons') },
                          { value: 'spring-summer' as SeasonFilter, label: t('shop.filters.springSummer') },
                          { value: 'fall-winter' as SeasonFilter, label: t('shop.filters.fallWinter') },
                        ]).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setSeasonFilter(opt.value)}
                            className={`
                              w-full flex items-center px-3 py-2.5 font-body text-caption transition-all cursor-pointer
                              ${seasonFilter === opt.value
                                ? 'bg-rust/[0.06] text-ink'
                                : 'text-ink-faded hover:text-ink hover:bg-warm-gray/5'
                              }
                            `}
                            aria-pressed={seasonFilter === opt.value}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </FilterSection>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Product grid ═══ */}
        <div
          role="tabpanel"
          id={`shop-panel-${activeCategory}`}
          aria-labelledby={`shop-tab-${activeCategory}`}
        >
          {filtered.length === 0 ? (
            <EmptyState onClear={clearAllFilters} hasFilters={activeFilterCount > 0} />
          ) : (
            <AnimatePresence>
              <motion.div
                key={`${activeCategory}-${sortBy}-${activeFilterCount}`}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="content-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 md:gap-x-6 md:gap-y-12"
              >
                {gridItems.map((item, index) =>
                  item.type === 'product' ? (
                    <ProductCard key={`p-${item.product.id}`} product={item.product} index={index} />
                  ) : (
                    <PromoCard key={`promo-${index}`} variant={item.variant} index={index} />
                  ),
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        </>
        )}
      </SectionContainer>
      <SectionContainer>
        <div className="border-t border-warm-gray/20 pt-16 mt-16 relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-rust/20 pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-rust/20 pointer-events-none" aria-hidden="true" />

          <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-10">
            {t('shop.sustainability.certifiedMaterials')}
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } })}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
              className="md:border-r border-warm-gray/15 md:pr-8"
            >
              <h4 className="font-display text-lg font-bold text-ink mb-2">
                {t('shop.sustainability.certifiedMaterials')}
              </h4>
              <p className="font-body text-caption text-ink-faded leading-[1.7]">
                {t('shop.sustainability.certifiedMaterialsDesc')}
              </p>
            </motion.div>

            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } })}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0, 0, 0.2, 1] }}
              className="md:border-r border-warm-gray/15 md:pr-8"
            >
              <h4 className="font-display text-lg font-bold text-ink mb-2">
                {t('shop.sustainability.ethicalProduction')}
              </h4>
              <p className="font-body text-caption text-ink-faded leading-[1.7]">
                {t('shop.sustainability.ethicalProductionDesc')}
              </p>
            </motion.div>

            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } })}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0, 0, 0.2, 1] }}
            >
              <h4 className="font-display text-lg font-bold text-ink mb-2">
                {t('shop.sustainability.carbonMeasured')}
              </h4>
              <p className="font-body text-caption text-ink-faded leading-[1.7]">
                {t('shop.sustainability.carbonMeasuredDesc')}
              </p>
            </motion.div>
          </div>
        </div>
      </SectionContainer>

      {/* ═══ Behind the Collection ═══ */}
      <SectionContainer>
        <div className="border-t border-warm-gray/20 pt-16">
          <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-3">
            {t('shop.behindCollection')}
          </span>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            <motion.div
              className="md:col-span-7"
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } })}
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

            <motion.div
              className="md:col-span-5 flex flex-col justify-center"
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 } })}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0, 0, 0.2, 1] }}
            >
              <p className="font-body text-body-sm text-ink-faded leading-[1.8] mb-4">
                {t('shop.editorial.paragraph1')}
              </p>
              <p className="font-body text-body-sm text-ink-faded leading-[1.8] mb-8">
                {t('shop.editorial.paragraph2')}
              </p>

              <StoryQuoteBlock
                quote={t('shop.quote.text')}
                author={t('shop.quote.author')}
                role={t('shop.quote.role')}
              />
            </motion.div>
          </div>
        </div>
      </SectionContainer>

      {/* ═══ Mobile filter slide-over ═══ */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[320px] max-w-[85vw] bg-paper shadow-[4px_0_30px_rgba(0,0,0,0.08)] overflow-y-auto lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={t('shop.filters.filterButton')}
            >
              {/* Header */}
              <div className="sticky top-0 bg-paper/95 backdrop-blur-sm z-10 flex items-center justify-between px-6 py-4 border-b border-warm-gray/15">
                <h3 className="font-display text-base font-bold text-ink">
                  {t('shop.filters.filterButton')}
                </h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-ink-faded hover:text-ink transition-colors cursor-pointer"
                  aria-label={t('shop.closeFilters', 'Close filters')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Filter content */}
              <div className="px-6">
                <FilterSection title={t('shop.filters.priceRange')}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={priceRange[0]}
                        min={priceBounds.min}
                        max={priceRange[1]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="flex-1 font-mono text-sm bg-transparent border-b border-warm-gray/30 py-2 text-ink focus:outline-none focus:border-rust"
                        aria-label="Minimum price"
                      />
                      <span className="font-body text-caption text-warm-gray">&mdash;</span>
                      <input
                        type="number"
                        value={priceRange[1]}
                        min={priceRange[0]}
                        max={priceBounds.max}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="flex-1 font-mono text-sm bg-transparent border-b border-warm-gray/30 py-2 text-ink focus:outline-none focus:border-rust"
                        aria-label="Maximum price"
                      />
                    </div>
                    <input
                      type="range"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full accent-[var(--color-rust)] cursor-pointer"
                      aria-label="Price range slider"
                    />
                  </div>
                </FilterSection>

                <FilterSection title={t('shop.filters.size')} defaultOpen={false}>
                  <div className="grid grid-cols-3 gap-2">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`
                          h-10 flex items-center justify-center font-mono text-xs tracking-wider transition-all cursor-pointer
                          ${selectedSizes.includes(size)
                            ? 'bg-ink text-paper'
                            : 'border border-warm-gray/30 text-ink-faded'
                          }
                        `}
                        aria-pressed={selectedSizes.includes(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title={t('shop.filters.color')} defaultOpen={false}>
                  {filterColorOptions.length === 0 ? (
                    <p className="font-body text-caption text-ink-faded leading-relaxed">
                      {t('shop.filters.noColorData')}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {filterColorOptions.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => toggleColor(color.name)}
                          className="flex items-center gap-2 cursor-pointer"
                          aria-pressed={selectedColors.includes(color.name)}
                          aria-label={color.name}
                        >
                          <span
                            className={`
                            w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center
                            ${selectedColors.includes(color.name) ? 'border-ink' : 'border-warm-gray/25'}
                          `}
                            style={{ backgroundColor: color.hex }}
                          >
                            {selectedColors.includes(color.name) && (
                              <svg
                                className={`w-3 h-3 ${hexNeedsLightForeground(color.hex) ? 'text-paper' : 'text-ink'}`}
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                              >
                                <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <span className="font-body text-caption text-ink-faded">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </FilterSection>

                <FilterSection title={t('shop.filters.sustainability')}>
                  <div className="space-y-1.5">
                    {(['all', 'good', 'excellent', 'exceptional'] as SustainFilter[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setSustainFilter(level)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 font-body text-caption transition-all cursor-pointer
                          ${sustainFilter === level ? 'bg-rust/[0.06] text-ink' : 'text-ink-faded'}
                        `}
                        aria-pressed={sustainFilter === level}
                      >
                        <span>{level === 'all' ? t('shop.filters.all') : level.charAt(0).toUpperCase() + level.slice(1)}</span>
                        {level !== 'all' && (
                          <span className="font-mono text-[10px] text-sepia-mid">
                            {level === 'good' ? '70+' : level === 'excellent' ? '80+' : '90+'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title={t('shop.filters.season')} defaultOpen={false}>
                  <div className="space-y-1.5">
                    {([
                      { value: 'all' as SeasonFilter, label: t('shop.filters.allSeasons') },
                      { value: 'spring-summer' as SeasonFilter, label: t('shop.filters.springSummer') },
                      { value: 'fall-winter' as SeasonFilter, label: t('shop.filters.fallWinter') },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSeasonFilter(opt.value)}
                        className={`
                          w-full flex items-center px-3 py-2.5 font-body text-caption transition-all cursor-pointer
                          ${seasonFilter === opt.value ? 'bg-rust/[0.06] text-ink' : 'text-ink-faded'}
                        `}
                        aria-pressed={seasonFilter === opt.value}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-paper/95 backdrop-blur-sm border-t border-warm-gray/15 px-6 py-4 flex gap-3">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 font-body text-label tracking-wide py-3 border border-warm-gray/30 text-ink-faded hover:text-ink transition-all cursor-pointer"
                >
                  {t('shop.filters.clearAll')}
                </button>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 font-body text-label tracking-wide py-3 bg-ink text-paper hover:bg-rust transition-colors cursor-pointer"
                >
                  {t('shop.results', { count: filtered.length })}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile filter FAB (visible when filters expanded on desktop but on mobile) */}
      <AnimatePresence>
        {!mobileFiltersOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            onClick={() => setMobileFiltersOpen(true)}
            className="fixed bottom-6 right-6 z-40 lg:hidden w-14 h-14 bg-ink text-paper rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-rust transition-colors"
            aria-label={t('shop.filters.filterButton')}
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 6h14M6 10h8M8 14h4" strokeLinecap="round" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rust text-paper rounded-full flex items-center justify-center text-[10px] font-medium">
                {activeFilterCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}

// Filter chip component
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 font-body text-[11px] tracking-wide px-2.5 py-1 bg-aged-stock border border-warm-gray/20 text-ink-faded hover:text-ink hover:border-warm-gray/40 transition-all cursor-pointer"
    >
      {label}
      <svg className="w-2.5 h-2.5 opacity-50" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// Empty state component
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
        {t('shop.empty')}
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
