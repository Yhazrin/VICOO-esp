import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import { VintageInput } from '@/components/editorial/VintageInput';
import { campaignsApi } from '@/services/campaigns';

const PAGE_SIZE = 6;

type StatusFilter = 'all' | 'active' | 'upcoming' | 'completed';

export default function Campaigns() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaigns', { status: filter, page, search }],
    queryFn: async () => {
      const result = await campaignsApi.getAll({
        page,
        page_size: PAGE_SIZE,
        status: filter === 'all' ? undefined : filter,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  const campaigns = useMemo(() => {
    let list = data?.items ?? [];

    if (filter !== 'all') {
      list = list.filter((c) => c.status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.subtitle ?? '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, filter, search]);

  const totalPages = data?.totalPages ?? Math.ceil(campaigns.length / PAGE_SIZE);
  const paginated = campaigns;

  const statuses: StatusFilter[] = ['all', 'active', 'upcoming', 'completed'];

  const handleFilterChange = (status: StatusFilter) => {
    setFilter(status);
    setPage(1);
  };

  return (
    <PageWrapper>
      <SectionContainer noTopSpacing>
        {/* Search bar */}
        <div className="mb-6 max-w-md pt-2">
          <VintageInput
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('campaigns.search.placeholder')}
            icon="search"
            className="py-2"
            aria-label={t('campaigns.search.placeholder')}
          />
        </div>

        {/* Filter tabs — capsule style */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className="flex items-center mb-8 rounded-full bg-white/80 backdrop-blur-xl shadow-sm px-2 py-1 overflow-x-auto"
          role="tablist"
          onKeyDown={(e) => {
            const tabs = e.currentTarget.querySelectorAll('[role="tab"]');
            const currentIndex = statuses.indexOf(filter);
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              const next = statuses[(currentIndex + 1) % statuses.length];
              handleFilterChange(next);
              (tabs[(currentIndex + 1) % tabs.length] as HTMLElement)?.focus();
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              const prev = statuses[(currentIndex - 1 + statuses.length) % statuses.length];
              handleFilterChange(prev);
              (tabs[(currentIndex - 1 + tabs.length) % tabs.length] as HTMLElement)?.focus();
            }
          }}
        >
          {statuses.map((status) => (
            <button
              key={status}
              role="tab"
              id={`tab-campaign-${status}`}
              aria-selected={filter === status}
              aria-controls="panel-campaigns"
              tabIndex={filter === status ? 0 : -1}
              onClick={() => handleFilterChange(status)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  const index = statuses.indexOf(filter);
                  const next = statuses[(index + 1) % statuses.length];
                  handleFilterChange(next);
                  document.getElementById(`tab-campaign-${next}`)?.focus();
                } else if (e.key === 'ArrowLeft') {
                  const index = statuses.indexOf(filter);
                  const prev = statuses[(index - 1 + statuses.length) % statuses.length];
                  handleFilterChange(prev);
                  document.getElementById(`tab-campaign-${prev}`)?.focus();
                }
              }}
              className={`
                font-body text-label tracking-wide px-3 py-1 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap
                ${filter === status
                  ? 'text-ink font-medium bg-rust/15'
                  : 'text-ink-faded hover:text-ink'
                }
              `}
            >
              {status === 'all'
                ? t('campaigns.filter.all')
                : t(`campaigns.status.${status}`)}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="font-body text-caption text-sepia-mid mb-6 tracking-wider">
          {t('campaigns.results', { count: campaigns.length })}
        </p>

        {/* Campaign list */}
        {isLoading ? (
          <div className="space-y-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 bg-warm-gray/20 aspect-[16/10] border border-warm-gray/20" />
                <div className="md:col-span-5 space-y-3">
                  <div className="h-4 bg-warm-gray/20 w-24" />
                  <div className="h-8 bg-warm-gray/20 w-3/4" />
                  <div className="h-4 bg-warm-gray/20 w-full" />
                  <div className="h-px bg-warm-gray/20 w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-24">
            <span className="font-display text-7xl text-rust/30 leading-none block mb-6 select-none">
              !
            </span>
            <p className="font-display text-lg text-ink-faded mb-2">
              {t('campaigns.loadError')}
            </p>
          </div>
        ) : paginated.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              id="panel-campaigns"
              role="tabpanel"
              aria-labelledby={`tab-campaign-${filter}`}
              key={`${filter}-${page}`}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-16"
            >
              {paginated.map((campaign, index) => {
                const isCompleted = campaign.status === 'completed';
                const fundingPercent = campaign.goalAmount > 0
                  ? Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)
                  : 0;

                return (
                  <motion.article
                    key={campaign.id}
                    {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 } })}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.7, ease: [0, 0, 0.2, 1] }}
                  >
                    <Link to={`/campaigns/${campaign.id}`} className="group block cursor-pointer">
                      <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 items-center ${index % 2 === 1 ? '' : ''}`}>
                        {/* Image */}
                        <div className={`md:col-span-7 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                          <div className={isCompleted ? 'opacity-85 grayscale-[15%]' : ''}>
                            <SepiaImageFrame
                              src={campaign.coverImageUrl}
                              alt={campaign.title}
                              aspectRatio="landscape"
                              size="full"
                            />
                          </div>
                        </div>

                        {/* Info */}
                        <div className={`md:col-span-5 ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                          <div className="flex items-center gap-3 mb-4">
                            <span className={`
                              font-body text-overline tracking-[0.2em] uppercase px-3 py-1 border
                              ${campaign.status === 'active' ? 'border-rust text-rust' : ''}
                              ${campaign.status === 'upcoming' ? 'border-pale-gold text-pale-gold' : ''}
                              ${campaign.status === 'completed' ? 'border-sepia-mid text-sepia-mid' : ''}
                            `}>
                              {t(`campaigns.status.${campaign.status}`)}
                            </span>
                            {isCompleted && fundingPercent >= 100 && (
                              <span className="font-body text-overline tracking-[0.2em] uppercase px-3 py-1 border border-sepia-mid text-sepia-mid flex items-center gap-1.5">
                                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                  <path d="M3 8.5l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {t('campaigns.goalReached')}
                              </span>
                            )}
                          </div>

                          <h3 className="font-display text-h3 md:text-h2 font-bold text-ink mb-3 group-hover:text-rust transition-colors">
                            {campaign.title}
                          </h3>

                          <p className="font-body text-body-sm text-ink-faded leading-relaxed mb-6">
                            {campaign.subtitle}
                          </p>

                          {/* Progress bar */}
                          {campaign.goalAmount > 0 && (
                            <div className="mb-4">
                              <div className="flex items-baseline justify-between mb-2">
                                <span className="font-body text-caption text-sepia-mid">
                                  ¥{campaign.raisedAmount.toLocaleString()} / ¥{campaign.goalAmount.toLocaleString()}
                                </span>
                                <span className="font-body text-caption text-sepia-mid">
                                  {isCompleted
                                    ? t('campaigns.funded', { percent: fundingPercent })
                                    : `${fundingPercent}%`
                                  }
                                </span>
                              </div>
                              <div className="h-1.5 bg-warm-gray/30 w-full overflow-hidden" role="progressbar" aria-valuenow={fundingPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${campaign.title} funding progress`}>
                                <motion.div
                                  {...(prefersReducedMotion
                                    ? { style: { transform: `scaleX(${Math.min(100, fundingPercent) / 100})` } }
                                    : { initial: { scaleX: 0 }, whileInView: { scaleX: Math.min(100, fundingPercent) / 100 } }
                                  )}
                                  viewport={{ once: true }}
                                  transition={{ duration: 1, delay: 0.3, type: 'spring', stiffness: 60, damping: 20 }}
                                  className={`h-full origin-left ${isCompleted ? 'bg-sepia-mid' : 'bg-rust'}`}
                                />
                              </div>
                            </div>
                          )}

                          {/* Featured child quote */}
                          {campaign.featured && campaign.featuredChild && (
                            <motion.div
                              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: -10 }, whileInView: { opacity: 1, x: 0 } })}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6, delay: 0.5 }}
                              className="border-l-2 border-rust/30 pl-4 mt-5"
                            >
                              <p className="font-display italic text-body-sm text-ink-faded leading-relaxed">
                                &ldquo;{campaign.featuredChild.quote}&rdquo;
                              </p>
                              <p className="font-body text-label text-sepia-mid mt-1.5 tracking-wider uppercase">
                                {campaign.featuredChild.name}, age {campaign.featuredChild.age}
                              </p>
                            </motion.div>
                          )}

                          <div className="flex gap-6 font-body text-caption text-sepia-mid mt-4">
                            <span>{campaign.artworkCount} {t('campaigns.detail.artworks')}</span>
                            <span>{campaign.participantCount} {t('campaigns.detail.participants')}</span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {index < paginated.length - 1 && (
                      <div className="editorial-divider mt-16" />
                    )}
                  </motion.article>
                );
              })}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-24"
          >
            <span className="font-display text-7xl text-warm-gray/30 leading-none block mb-6 select-none">
              &ldquo;
            </span>
            <p className="font-display text-lg text-ink-faded mb-2">
              {t('campaigns.empty.title')}
            </p>
            <p className="font-body text-body-sm text-sepia-mid">
              {t('campaigns.empty.subtitle')}
            </p>
          </motion.div>
        )}

        {/* Pagination — capsule style */}
        {totalPages > 1 && (
          <nav aria-label={t('campaigns.pagination.ariaLabel')} className="flex items-center justify-center mt-16">
            <div className="flex items-center rounded-full bg-white/80 backdrop-blur-xl shadow-sm px-2 py-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label={t('campaigns.pagination.prevAria')}
                className="font-body text-label tracking-wider uppercase px-3 py-1 rounded-full text-ink-faded hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {t('campaigns.pagination.prev')}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-label={`${t('campaigns.pagination.pageAria')} ${p}`}
                  aria-current={page === p ? 'page' : undefined}
                  className={`
                    w-9 h-9 font-body text-caption rounded-full transition-all cursor-pointer
                    ${page === p
                      ? 'bg-rust text-paper font-medium'
                      : 'text-ink-faded hover:text-ink'
                    }
                  `}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label={t('campaigns.pagination.nextAria')}
                className="font-body text-label tracking-wider uppercase px-3 py-1 rounded-full text-ink-faded hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {t('campaigns.pagination.next')}
              </button>
            </div>
          </nav>
        )}

        {/* CTA */}
        <div className="pt-8">
          <motion.div
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } })}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border border-warm-gray/30 p-10 md:p-14 text-center"
          >
            <p className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid mb-4">
              {t('campaigns.cta.eyebrow', 'Every Thread Tells a Story')}
            </p>
            <h2 className="font-display text-h2 md:text-[32px] text-ink font-medium mb-4">
              {t('campaigns.cta.title', 'Start a Campaign')}
            </h2>
            <p className="font-body text-body-sm text-ink-faded max-w-[480px] mx-auto mb-8 leading-relaxed">
              {t('campaigns.cta.body', 'Are you a school, community center, or organization? Partner with us to bring sustainable fashion education to your community.')}
            </p>
            <Link
              to="/contact"
              className="inline-block font-mono text-[10px] tracking-[0.18em] uppercase bg-ink text-paper px-8 py-4 hover:bg-rust transition-colors duration-300 cursor-pointer"
            >
              {t('campaigns.cta.button', 'Get in Touch')}
            </Link>
          </motion.div>
        </div>
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
