import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import { VintageInput } from '@/components/editorial/VintageInput';
import { campaignsApi } from '@/services/campaigns';
import type { Campaign } from '@/types';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    title: 'Threads of Tomorrow',
    subtitle: 'Children from rural Guizhou reimagine what sustainable fashion means through watercolors and dreams.',
    description: 'A campaign exploring the intersection of childhood imagination and sustainable textile production.',
    coverImageUrl: 'https://picsum.photos/seed/threads-tomorrow/800/500',
    startDate: '2026-01-15',
    endDate: '2026-06-30',
    status: 'active',
    artworkCount: 142,
    participantCount: 89,
    goalAmount: 50000,
    raisedAmount: 32500,
    featured: true,
    featuredChild: {
      name: 'Xiao Lin',
      age: 8,
      quote: 'I never thought my painting of the ocean would become something people can wear.',
    },
  },
  {
    id: 2,
    title: 'Ocean Dreams',
    subtitle: 'Shanghai coastal communities paint their vision of a plastic-free ocean, transformed into beachwear.',
    description: 'Marine-themed artwork by children from fishing communities, turned into sustainable swimwear.',
    coverImageUrl: 'https://picsum.photos/seed/ocean-dreams/800/500',
    startDate: '2026-03-01',
    endDate: '2026-09-30',
    status: 'active',
    artworkCount: 67,
    participantCount: 45,
    goalAmount: 35000,
    raisedAmount: 12800,
    featured: true,
    featuredChild: {
      name: 'Mei Hua',
      age: 10,
      quote: 'My grandmother taught me to love the sea. Now I can show everyone why it matters.',
    },
  },
  {
    id: 3,
    title: 'Mountain Stories',
    subtitle: 'Yunnan children share their relationship with the mountains through textile art.',
    description: 'A completed campaign that brought mountain-inspired textile art to international fashion shows.',
    coverImageUrl: 'https://picsum.photos/seed/mountain-stories/800/500',
    startDate: '2025-09-01',
    endDate: '2026-02-28',
    status: 'completed',
    artworkCount: 203,
    participantCount: 156,
    goalAmount: 80000,
    raisedAmount: 82400,
    featured: true,
    featuredChild: {
      name: 'Ah Jie',
      age: 7,
      quote: 'The mountain behind my school is where I go to think. Now my drawing of it is on a real jacket.',
    },
  },
  {
    id: 4,
    title: 'City Rhythms',
    subtitle: 'Urban children interpret the pulse of their city through abstract prints and patterns.',
    description: 'Launching this summer — registration for schools opens May 2026.',
    coverImageUrl: 'https://picsum.photos/seed/city-rhythms/800/500',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    status: 'upcoming',
    artworkCount: 0,
    participantCount: 0,
    goalAmount: 45000,
    raisedAmount: 0,
    featured: false,
  },
  {
    id: 5,
    title: 'Forest Whispers',
    subtitle: 'Children from Sichuan villages paint the stories their grandparents told about the ancient forests.',
    description: 'A campaign connecting oral tradition with sustainable forestry and textile sourcing.',
    coverImageUrl: 'https://picsum.photos/seed/forest-whispers/800/500',
    startDate: '2025-06-01',
    endDate: '2025-12-31',
    status: 'completed',
    artworkCount: 178,
    participantCount: 120,
    goalAmount: 60000,
    raisedAmount: 64200,
    featured: false,
  },
  {
    id: 6,
    title: 'Starlight Weavers',
    subtitle: 'Night sky patterns from Tibetan highland children woven into scarves and wraps.',
    description: 'High-altitude astronomy meets textile craftsmanship in this unique cross-cultural project.',
    coverImageUrl: 'https://picsum.photos/seed/starlight-weavers/800/500',
    startDate: '2026-04-01',
    endDate: '2026-10-31',
    status: 'active',
    artworkCount: 34,
    participantCount: 28,
    goalAmount: 55000,
    raisedAmount: 8700,
    featured: false,
  },
];

const PAGE_SIZE = 6;

type StatusFilter = 'all' | 'active' | 'upcoming' | 'completed';

export default function Campaigns() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', { status: filter, page, search }],
    queryFn: async () => {
      try {
        const result = await campaignsApi.getAll({
          page,
          page_size: PAGE_SIZE,
          status: filter === 'all' ? undefined : filter,
        });
        return result;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const campaigns = useMemo(() => {
    let list = data?.items ?? MOCK_CAMPAIGNS;

    if (filter !== 'all') {
      list = list.filter((c) => c.status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, filter, search]);

  const totalPages = data?.totalPages ?? Math.ceil(campaigns.length / PAGE_SIZE);
  const paginated = data?.items
    ? campaigns
    : campaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statuses: StatusFilter[] = ['all', 'active', 'upcoming', 'completed'];

  const handleFilterChange = (status: StatusFilter) => {
    setFilter(status);
    setPage(1);
  };

  return (
    <PageWrapper>
      <EditorialHero
        title={t('campaigns.hero.title')}
        subtitle={t('campaigns.hero.subtitle')}
        hideHero={true}
      />

      <SectionContainer noTopSpacing>
        <NumberedSectionHeading
          number="01"
          title={t('campaigns.listing.sectionTitle')}
          subtitle={t('campaigns.listing.sectionSubtitle')}
        />

        {/* Search bar */}
        <div className="mb-8 max-w-md">
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

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-12 border-b border-warm-gray/30 overflow-x-auto" role="tablist">
          {statuses.map((status, index) => (
            <motion.button
              key={status}
              role="tab"
              aria-selected={filter === status}
              onClick={() => handleFilterChange(status)}
              {...(prefersReducedMotion ? {} : {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: index * 0.05 },
                whileHover: { y: -2 },
              })}
              className={`
                font-body text-caption tracking-[0.15em] uppercase px-4 py-3 transition-all duration-200 border-b-2 -mb-px whitespace-nowrap relative cursor-pointer
                ${filter === status
                  ? 'border-rust text-rust'
                  : 'border-transparent text-sepia-mid hover:text-ink'
                }
              `}
            >
              <span className="font-body text-overline text-sepia-mid/60 mr-1.5">
                {String(index + 1).padStart(2, '0')}
              </span>
              {status === 'all'
                ? t('campaigns.filter.all')
                : t(`campaigns.status.${status}`)}
              {filter === status && (
                <motion.span
                  layoutId="campaign-category-indicator"
                  className="absolute bottom-0 left-0 right-0 h-px bg-rust"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Results count */}
        <p className="font-body text-caption text-sepia-mid mb-8 tracking-wider">
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
        ) : paginated.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-16">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label={t('campaigns.pagination.prev')}
              className="font-body text-caption tracking-wider uppercase px-4 py-2 border border-warm-gray/30 text-sepia-mid hover:border-rust hover:text-rust disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {t('campaigns.pagination.prev')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                aria-label={`Page ${p}`}
                aria-current={page === p ? 'page' : undefined}
                className={`
                  w-11 h-11 font-body text-caption border transition-all cursor-pointer
                  ${page === p
                    ? 'border-rust bg-rust text-paper'
                    : 'border-warm-gray/30 text-sepia-mid hover:border-rust hover:text-rust'
                  }
                `}
              >
                {String(p).padStart(2, '0')}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label={t('campaigns.pagination.next')}
              className="font-body text-caption tracking-wider uppercase px-4 py-2 border border-warm-gray/30 text-sepia-mid hover:border-rust hover:text-rust disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {t('campaigns.pagination.next')}
            </button>
          </div>
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
