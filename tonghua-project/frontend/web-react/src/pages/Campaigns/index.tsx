import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
    id: '1',
    title: 'Threads of Tomorrow',
    subtitle: 'Children from rural Guizhou reimagine what sustainable fashion means through watercolors and dreams.',
    description: 'A campaign exploring the intersection of childhood imagination and sustainable textile production.',
    coverImageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=500&fit=crop',
    startDate: '2026-01-15',
    endDate: '2026-06-30',
    status: 'active',
    artworkCount: 142,
    participantCount: 89,
    goalAmount: 50000,
    raisedAmount: 32500,
    featured: true,
  },
  {
    id: '2',
    title: 'Ocean Dreams',
    subtitle: 'Shanghai coastal communities paint their vision of a plastic-free ocean, transformed into beachwear.',
    description: 'Marine-themed artwork by children from fishing communities, turned into sustainable swimwear.',
    coverImageUrl: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&h=500&fit=crop',
    startDate: '2026-03-01',
    endDate: '2026-09-30',
    status: 'active',
    artworkCount: 67,
    participantCount: 45,
    goalAmount: 35000,
    raisedAmount: 12800,
    featured: true,
  },
  {
    id: '3',
    title: 'Mountain Stories',
    subtitle: 'Yunnan children share their relationship with the mountains through textile art.',
    description: 'A completed campaign that brought mountain-inspired textile art to international fashion shows.',
    coverImageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=500&fit=crop',
    startDate: '2025-09-01',
    endDate: '2026-02-28',
    status: 'completed',
    artworkCount: 203,
    participantCount: 156,
    goalAmount: 80000,
    raisedAmount: 82400,
    featured: true,
  },
  {
    id: '4',
    title: 'City Rhythms',
    subtitle: 'Urban children interpret the pulse of their city through abstract prints and patterns.',
    description: 'Launching this summer — registration for schools opens May 2026.',
    coverImageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=500&fit=crop',
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
    id: '5',
    title: 'Forest Whispers',
    subtitle: 'Children from Sichuan villages paint the stories their grandparents told about the ancient forests.',
    description: 'A campaign connecting oral tradition with sustainable forestry and textile sourcing.',
    coverImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop',
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
    id: '6',
    title: 'Starlight Weavers',
    subtitle: 'Night sky patterns from Tibetan highland children woven into scarves and wraps.',
    description: 'High-altitude astronomy meets textile craftsmanship in this unique cross-cultural project.',
    coverImageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=500&fit=crop',
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
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', { status: filter, page, search }],
    queryFn: async () => {
      try {
        const result = await campaignsApi.getAll({
          page,
          pageSize: PAGE_SIZE,
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
        number="03"
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
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-12 border-b border-warm-gray/30 overflow-x-auto">
          {statuses.map((status, index) => (
            <motion.button
              key={status}
              onClick={() => handleFilterChange(status)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              className={`
                font-body text-xs tracking-[0.15em] uppercase px-4 py-3 transition-all duration-200 border-b-2 -mb-px whitespace-nowrap relative
                ${filter === status
                  ? 'border-rust text-rust'
                  : 'border-transparent text-sepia-mid hover:text-ink'
                }
              `}
            >
              <span className="font-body text-[10px] text-sepia-mid/60 mr-1.5">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-16"
            >
              {paginated.map((campaign, index) => (
                <motion.article
                  key={campaign.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.7, ease: [0, 0, 0.2, 1] }}
                >
                  <Link to={`/campaigns/${campaign.id}`} className="group block">
                    <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 items-center ${index % 2 === 1 ? '' : ''}`}>
                      {/* Image */}
                      <div className={`md:col-span-7 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                        <SepiaImageFrame
                          src={campaign.coverImageUrl}
                          alt={campaign.title}
                          aspectRatio="landscape"
                          size="full"
                        />
                      </div>

                      {/* Info */}
                      <div className={`md:col-span-5 ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`
                            font-body text-[10px] tracking-[0.2em] uppercase px-3 py-1 border
                            ${campaign.status === 'active' ? 'border-rust text-rust' : ''}
                            ${campaign.status === 'upcoming' ? 'border-pale-gold text-pale-gold' : ''}
                            ${campaign.status === 'completed' ? 'border-sepia-mid text-sepia-mid' : ''}
                          `}>
                            {t(`campaigns.status.${campaign.status}`)}
                          </span>
                        </div>

                        <h3 className="font-display text-h3 md:text-h2 font-bold text-ink mb-3 group-hover:text-rust transition-colors">
                          {campaign.title}
                        </h3>

                        <p className="font-body text-sm text-ink-faded leading-relaxed mb-6">
                          {campaign.subtitle}
                        </p>

                        {/* Progress bar */}
                        {campaign.goalAmount > 0 && (
                          <div className="mb-4">
                            <div className="flex items-baseline justify-between mb-2">
                              <span className="font-body text-xs text-sepia-mid">
                                ¥{campaign.raisedAmount.toLocaleString()} / ¥{campaign.goalAmount.toLocaleString()}
                              </span>
                              <span className="font-body text-xs text-sepia-mid">
                                {Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}%
                              </span>
                            </div>
                            <div className="h-px bg-warm-gray/30 w-full">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${Math.min(100, (campaign.raisedAmount / campaign.goalAmount) * 100)}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="h-full bg-rust"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-6 font-body text-xs text-sepia-mid">
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
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="font-body text-sm text-ink-faded text-center py-20">
            {t('campaigns.empty')}
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-16">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="font-body text-caption tracking-wider uppercase px-4 py-2 border border-warm-gray/30 text-sepia-mid hover:border-rust hover:text-rust disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {t('campaigns.pagination.prev')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`
                  w-10 h-10 font-body text-caption border transition-all
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
              className="font-body text-caption tracking-wider uppercase px-4 py-2 border border-warm-gray/30 text-sepia-mid hover:border-rust hover:text-rust disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {t('campaigns.pagination.next')}
            </button>
          </div>
        )}
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
