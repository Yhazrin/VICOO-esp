import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { artworksApi } from '@/services/artworks';
import { campaignsApi } from '@/services/campaigns';
import { editorialApi } from '@/services/editorial';
import { allowWebMockFallback } from '@/config/runtime';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import { VintageInput } from '@/components/editorial/VintageInput';
import PagePeel from '@/components/animations/PagePeel';
import { KineticTextMarquee } from '@/components/animations/KineticMarquee';

type Category = 'all' | 'impact' | 'fashion' | 'community' | 'education';

interface StoryItem {
  id: string;
  title: string;
  excerpt: string;
  pullQuote: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  readTimeMinutes: number;
  category: 'impact' | 'fashion' | 'community' | 'education';
}

// Marquee quotes with attribution (requires i18n t function)
function getStoryQuotes(t: (key: string) => string) {
  return [
    { text: t('stories.marquee.quote1'), attribution: t('stories.marquee.attr1') },
    { text: t('stories.marquee.quote2'), attribution: t('stories.marquee.attr2') },
    { text: t('stories.marquee.quote3'), attribution: t('stories.marquee.attr3') },
    { text: t('stories.marquee.quote4'), attribution: t('stories.marquee.attr4') },
    { text: t('stories.marquee.quote5'), attribution: t('stories.marquee.attr5') },
  ];
}

// Mock stories data (requires i18n t function)
function getMockStories(t: (key: string) => string): StoryItem[] {
  return [
    {
      id: '1',
      title: t('stories.mock.title1'),
      excerpt: t('stories.mock.excerpt1'),
      pullQuote: t('stories.mock.pull1'),
      coverImage: 'https://picsum.photos/seed/ocean-girl/800/600',
      author: t('stories.mock.author1'),
      publishedAt: '2026-02-15',
      readTimeMinutes: 8,
      category: 'impact',
    },
    {
      id: '2',
      title: t('stories.mock.title2'),
      excerpt: t('stories.mock.excerpt2'),
      pullQuote: t('stories.mock.pull2'),
      coverImage: 'https://picsum.photos/seed/waste-wearable/800/600',
      author: t('stories.mock.author2'),
      publishedAt: '2026-02-01',
      readTimeMinutes: 12,
      category: 'fashion',
    },
    {
      id: '3',
      title: t('stories.mock.title3'),
      excerpt: t('stories.mock.excerpt3'),
      pullQuote: t('stories.mock.pull3'),
      coverImage: 'https://picsum.photos/seed/classroom-gallery/800/600',
      author: t('stories.mock.author3'),
      publishedAt: '2026-01-20',
      readTimeMinutes: 6,
      category: 'community',
    },
    {
      id: '4',
      title: t('stories.mock.title4'),
      excerpt: t('stories.mock.excerpt4'),
      pullQuote: t('stories.mock.pull4'),
      coverImage: 'https://picsum.photos/seed/sustainability-art/800/600',
      author: t('stories.mock.author4'),
      publishedAt: '2026-01-10',
      readTimeMinutes: 10,
      category: 'education',
    },
    {
      id: '5',
      title: t('stories.mock.title5'),
      excerpt: t('stories.mock.excerpt5'),
      pullQuote: t('stories.mock.pull5'),
      coverImage: 'https://picsum.photos/seed/numbers-mission/800/600',
      author: t('stories.mock.author5'),
      publishedAt: '2025-12-28',
      readTimeMinutes: 15,
      category: 'impact',
    },
  ];
}

// Decorative SVG ornament for the newsletter section
function EditorialOrnament({ className = '', prefersReducedMotion = false }: { className?: string; prefersReducedMotion?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 24"
      className={`w-32 mx-auto ${className}`}
      aria-hidden="true"
    >
      <motion.line
        x1="0" y1="12" x2="70" y2="12"
        strokeWidth="0.5"
        style={{ stroke: 'var(--color-rust)' }}
        {...(prefersReducedMotion ? {} : {
          initial: { pathLength: 0 },
          whileInView: { pathLength: 1 },
          viewport: { once: true },
          transition: { duration: 1, ease: 'easeInOut' as const },
        })}
      />
      <motion.circle
        cx="85" cy="12" r="3"
        fill="none"
        strokeWidth="0.75"
        style={{ stroke: 'var(--color-rust)' }}
        {...(prefersReducedMotion ? {} : {
          initial: { scale: 0 },
          whileInView: { scale: 1 },
          viewport: { once: true },
          transition: { duration: 0.5, delay: 0.5, type: 'spring' as const, stiffness: 300 },
        })}
      />
      <motion.circle
        cx="100" cy="12" r="1.5"
        style={{ fill: 'var(--color-rust)' }}
        {...(prefersReducedMotion ? {} : {
          initial: { scale: 0 },
          whileInView: { scale: 1 },
          viewport: { once: true },
          transition: { duration: 0.5, delay: 0.7, type: 'spring' as const, stiffness: 300 },
        })}
      />
      <motion.circle
        cx="115" cy="12" r="3"
        fill="none"
        strokeWidth="0.75"
        style={{ stroke: 'var(--color-rust)' }}
        {...(prefersReducedMotion ? {} : {
          initial: { scale: 0 },
          whileInView: { scale: 1 },
          viewport: { once: true },
          transition: { duration: 0.5, delay: 0.9, type: 'spring' as const, stiffness: 300 },
        })}
      />
      <motion.line
        x1="130" y1="12" x2="200" y2="12"
        strokeWidth="0.5"
        style={{ stroke: 'var(--color-rust)' }}
        {...(prefersReducedMotion ? {} : {
          initial: { pathLength: 0 },
          whileInView: { pathLength: 1 },
          viewport: { once: true },
          transition: { duration: 1, ease: 'easeInOut' as const, delay: 0.3 },
        })}
      />
    </svg>
  );
}

// Reading progress bar at the bottom of story cards
function ReadingProgressBar({ readTimeMinutes, prefersReducedMotion = false, ariaLabel }: { readTimeMinutes: number; prefersReducedMotion?: boolean; ariaLabel: string }) {
  const maxReadTime = 20;
  const widthPercent = Math.min((readTimeMinutes / maxReadTime) * 100, 100);

  return (
    <div className="mt-4 h-[2px] w-full bg-warm-gray/20 rounded-sm overflow-hidden" role="progressbar" aria-valuenow={readTimeMinutes} aria-valuemin={0} aria-valuemax={maxReadTime} aria-label={ariaLabel}>
      <motion.div
        className="h-full bg-rust/60 rounded-sm origin-left"
        style={prefersReducedMotion ? { transform: `scaleX(${widthPercent / 100})` } : undefined}
        {...(prefersReducedMotion ? {} : {
          initial: { scaleX: 0 },
          whileInView: { scaleX: widthPercent / 100 },
          viewport: { once: true },
          transition: { duration: 0.8, delay: 0.3, ease: [0, 0, 0.2, 1] },
        })}
      />
    </div>
  );
}

// Beautiful empty state with SVG illustration
function EmptyState({ onBrowseAll }: { onBrowseAll: () => void }) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      className="py-20 md:py-32 flex flex-col items-center text-center"
    >
      {/* Decorative SVG illustration */}
      <svg
        viewBox="0 0 120 120"
        className="w-24 h-24 mb-8 text-warm-gray"
        aria-hidden="true"
      >
        {/* Open book */}
        <motion.path
          d="M60 85 C55 85 30 82 20 78 L20 35 C30 39 55 42 60 42 C65 42 90 39 100 35 L100 78 C90 82 65 85 60 85Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          {...(prefersReducedMotion ? {} : {
            initial: { pathLength: 0 },
            animate: { pathLength: 1 },
            transition: { duration: 1.5, ease: 'easeInOut' as const },
          })}
        />
        {/* Spine */}
        <motion.line
          x1="60" y1="42" x2="60" y2="85"
          stroke="currentColor"
          strokeWidth="1"
          {...(prefersReducedMotion ? {} : {
            initial: { pathLength: 0 },
            animate: { pathLength: 1 },
            transition: { duration: 0.8, delay: 0.5 },
          })}
        />
        {/* Blank page lines left */}
        <motion.line x1="30" y1="52" x2="52" y2="52" stroke="currentColor" strokeWidth="0.5" opacity="0.4"
          {...(prefersReducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.4, delay: 1 } })} />
        <motion.line x1="30" y1="58" x2="50" y2="58" stroke="currentColor" strokeWidth="0.5" opacity="0.4"
          {...(prefersReducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.4, delay: 1.1 } })} />
        <motion.line x1="30" y1="64" x2="48" y2="64" stroke="currentColor" strokeWidth="0.5" opacity="0.4"
          {...(prefersReducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.4, delay: 1.2 } })} />
        {/* Blank page lines right */}
        <motion.line x1="68" y1="52" x2="90" y2="52" stroke="currentColor" strokeWidth="0.5" opacity="0.4"
          {...(prefersReducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.4, delay: 1 } })} />
        <motion.line x1="68" y1="58" x2="88" y2="58" stroke="currentColor" strokeWidth="0.5" opacity="0.4"
          {...(prefersReducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.4, delay: 1.1 } })} />
        <motion.line x1="68" y1="64" x2="86" y2="64" stroke="currentColor" strokeWidth="0.5" opacity="0.4"
          {...(prefersReducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.4, delay: 1.2 } })} />
        {/* Small pencil */}
        <motion.g
          style={{ transformOrigin: '95px 30px' }}
          {...(prefersReducedMotion ? {} : {
            initial: { opacity: 0, rotate: -20 },
            animate: { opacity: 1, rotate: 0 },
            transition: { duration: 0.6, delay: 1.4, type: 'spring' as const, stiffness: 200 },
          })}
        >
          <line x1="88" y1="38" x2="98" y2="22" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: 'var(--color-rust)' }} />
          <polygon points="98,22 100,19 96,19" style={{ fill: 'var(--color-rust)' }} />
        </motion.g>
      </svg>

      <h3 className="font-display text-h3 text-ink mb-3">
        {t('stories.empty.title')}
      </h3>
      <p className="font-body text-body-sm text-sepia-mid max-w-sm leading-relaxed mb-8">
        {t('stories.empty.body')}
      </p>
      <motion.button
        onClick={onBrowseAll}
        whileHover={prefersReducedMotion ? undefined : { y: -2 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
        className="font-body text-caption tracking-[0.15em] uppercase text-rust border-b border-rust/30 pb-1 hover:text-ink hover:border-ink/30 transition-colors cursor-pointer min-h-[44px] px-4 py-3"
      >
        {t('stories.empty.browseAll')}
      </motion.button>
    </motion.div>
  );
}

export default function Stories() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const categories: Category[] = ['all', 'impact', 'fashion', 'community', 'education'];

  // Fetch editorial feed + artworks/campaign enrichments from API.
  const { data: storiesFeed } = useQuery({
    queryKey: ['stories-feed'],
    queryFn: async () => {
      try {
        const [editorialFeed, artworks, activeCampaign] = await Promise.all([
          editorialApi.getFeed(10),
          artworksApi.getAll({ page_size: 10 }),
          campaignsApi.getActive().catch(() => null),
        ]);
        return { editorialFeed, artworks, activeCampaign };
      }
      catch {
        if (allowWebMockFallback) return null;
        throw new Error('Stories feed unavailable and fallback disabled');
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Convert API feed/artworks to StoryItem format; fall back to MOCK_STORIES when enabled.
  const stories: StoryItem[] = useMemo(() => {
    if (storiesFeed?.editorialFeed?.length) {
      return storiesFeed.editorialFeed.map((item, i) => ({
        id: String(item.id),
        title: item.title,
        excerpt: item.excerpt,
        pullQuote: item.pull_quote || t('stories.mock.pull3'),
        coverImage: item.cover_image || `https://picsum.photos/seed/editorial-${item.id}/800/600`,
        author: item.author || t('stories.anonymousArtist'),
        publishedAt: item.published_at || '2026-01-01',
        readTimeMinutes: item.read_time_minutes || (5 + (i % 4) * 3),
        category: (item.category || ['impact', 'community', 'education', 'fashion'][i % 4]) as StoryItem['category'],
      }));
    }
    if (storiesFeed?.artworks?.items?.length) {
      return storiesFeed.artworks.items.map((artwork, i) => ({
        id: String(artwork.id),
        title: artwork.title,
        excerpt: artwork.description || t('stories.artworkFallback'),
        pullQuote: artwork.vote_count > 0 ? t('stories.supporters', { count: artwork.vote_count }) : t('stories.mock.pull3'),
        coverImage: artwork.image_url || `https://picsum.photos/seed/artwork-${artwork.id}/800/600`,
        author: artwork.childParticipant?.firstName || storiesFeed.activeCampaign?.featuredChild?.name || t('stories.anonymousArtist'),
        publishedAt: artwork.created_at ? artwork.created_at.split('T')[0] : '2026-01-01',
        readTimeMinutes: 5 + (i % 4) * 3,
        category: ['impact', 'community', 'education', 'fashion'][i % 4] as StoryItem['category'],
      }));
    }
    return allowWebMockFallback ? getMockStories(t) : [];
  }, [storiesFeed, t]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = {
      all: stories.length,
      impact: 0,
      fashion: 0,
      community: 0,
      education: 0,
    };
    for (const story of stories) {
      counts[story.category]++;
    }
    return counts;
  }, [stories]);

  const filtered = activeCategory === 'all'
    ? stories
    : stories.filter((s) => s.category === activeCategory);

  const handleSubscribe = () => {
    if (email.trim()) {
      setIsSubscribed(true);
    }
  };

  return (
    <PageWrapper>
      <h1 className="sr-only">{t('stories.hero.title')}</h1>
      <EditorialHero
        title={t('stories.hero.title')}
        subtitle={t('stories.hero.subtitle')}
        hideHero={true}
      />

      {/* Kinetic marquee with attributed quotes */}
      <KineticTextMarquee
        items={getStoryQuotes(t).map((q) => `${q.text} — ${q.attribution}`)}
        direction="left"
        speed={0.8}
        pauseOnHover={true}
      />

      <SectionContainer noTopSpacing>
        {/* Category filter with count badges */}
        <div className="flex items-center gap-1 mb-12 border-b border-warm-gray/30 overflow-x-auto" role="tablist">
          {categories.map((cat, catIndex) => (
            <motion.button
              key={cat}
              role="tab"
              id={`tab-story-${cat}`}
              aria-selected={activeCategory === cat}
              aria-controls="panel-stories"
              tabIndex={activeCategory === cat ? 0 : -1}
              onClick={() => setActiveCategory(cat)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  const next = categories[(catIndex + 1) % categories.length];
                  setActiveCategory(next);
                  document.getElementById(`tab-story-${next}`)?.focus();
                } else if (e.key === 'ArrowLeft') {
                  const prev = categories[(catIndex - 1 + categories.length) % categories.length];
                  setActiveCategory(prev);
                  document.getElementById(`tab-story-${prev}`)?.focus();
                }
              }}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              className={`
                font-body text-caption tracking-[0.15em] uppercase px-4 py-3 transition-all duration-200 border-b-2 -mb-px whitespace-nowrap relative cursor-pointer
                ${activeCategory === cat
                  ? 'border-rust text-rust'
                  : 'border-transparent text-sepia-mid hover:text-ink'
                }
              `}
            >
              <span className="inline-flex items-center gap-2">
                {t(`stories.categories.${cat}`)}
                <span
                  className={`
                    inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm text-overline font-medium leading-none
                    ${activeCategory === cat
                      ? 'bg-rust/10 text-rust'
                      : 'bg-warm-gray/20 text-ink-light'
                    }
                  `}
                >
                  {categoryCounts[cat]}
                </span>
              </span>
              {activeCategory === cat && (
                <motion.span
                  layoutId="story-category-indicator"
                  className="absolute bottom-0 left-0 right-0 h-px bg-rust"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Magazine spread stories */}
        <div id="panel-stories" role="tabpanel" aria-labelledby={`tab-story-${activeCategory}`}>
          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              <motion.div
                key={activeCategory}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-0"
              >
                {filtered.map((story, index) => {
                // Alternate peel corners for visual interest
                const peelCorner = index % 2 === 0 ? 'bottom-right' : 'bottom-left';
                return (
                  <PagePeel
                    key={story.id}
                    corner={peelCorner}
                    maxRotation={12}
                    shadowIntensity={0.25}
                    className="mb-16 md:mb-24"
                  >
                    <motion.article
                      {...(prefersReducedMotion
                        ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { duration: 0.3 } }
                        : { initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-100px' }, transition: { duration: 0.8, ease: [0, 0, 0.2, 1] } }
                      )}
                    >
                      <Link to={`/artworks/${story.id}`} className="group block cursor-pointer">
                        <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center ${index % 2 === 1 ? '' : ''}`}>
                          {/* Image */}
                          <div className={`md:col-span-7 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                            <SepiaImageFrame
                              src={story.coverImage}
                              alt={story.title}
                              aspectRatio={index === 0 ? 'wide' : 'landscape'}
                              size="full"
                            />
                          </div>

                          {/* Text */}
                          <div className={`md:col-span-5 ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                            {/* Category pill tag */}
                            <span className="inline-block font-body text-overline text-rust tracking-[0.25em] uppercase mb-4 px-3 py-1 border border-rust/30 rounded-sm">
                              {t(`stories.categories.${story.category}`)}
                            </span>

                            <h2 className="font-display text-h3 md:text-h2 font-bold text-ink mb-4 group-hover:text-rust transition-colors leading-tight">
                              {story.title}
                            </h2>

                            <p className="font-body text-body-sm text-ink-faded leading-relaxed mb-4">
                              {story.excerpt}
                            </p>

                            {/* Pull quote / key stat */}
                            <p className="font-body text-caption text-rust/80 italic mb-4 pl-3 border-l-2 border-rust/30">
                              {story.pullQuote}
                            </p>

                            <div className="flex items-center gap-4 font-body text-caption text-sepia-mid">
                              <span>{story.author}</span>
                              <span className="text-sepia-mid/40">|</span>
                              <span>{story.readTimeMinutes} {t('stories.readTime')}</span>
                              <span className="text-sepia-mid/40">|</span>
                              <span>{story.publishedAt}</span>
                            </div>

                            {/* Reading progress indicator */}
                            <ReadingProgressBar readTimeMinutes={story.readTimeMinutes} prefersReducedMotion={prefersReducedMotion ?? false} ariaLabel={`${story.readTimeMinutes} ${t('stories.minuteRead')}`} />

                            {/* Read more link */}
                            <div className="mt-4">
                              <span className="font-body text-caption text-rust tracking-[0.15em] uppercase group-hover:text-ink transition-colors">
                                {t('stories.readMore')} &rarr;
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Insert a quote block after the first story */}
                      {index === 0 && (
                        <div className="mt-16 md:mt-24">
                          <PagePeel corner="top-right" maxRotation={8} shadowIntensity={0.2}>
                            <StoryQuoteBlock
                              quote={t('stories.featuredQuote.text')}
                              author={t('stories.featuredQuote.author')}
                              role={t('stories.featuredQuote.role')}
                            />
                          </PagePeel>
                        </div>
                      )}

                      {index < filtered.length - 1 && index !== 0 && (
                        <div className="editorial-divider mt-16 md:mt-24" />
                      )}
                    </motion.article>
                  </PagePeel>
                );
                })}
              </motion.div>
            ) : (
              <EmptyState onBrowseAll={() => setActiveCategory('all')} />
            )}
          </AnimatePresence>
        </div>
      </SectionContainer>

      {/* Newsletter CTA */}
      <section className="bg-aged-stock section-spacing">
        <SectionContainer narrow>
          <div className="text-center">
            <NumberedSectionHeading
              number="05"
              title={t('stories.newsletter.title')}
              subtitle={t('stories.newsletter.subtitle')}
            />

            {/* Emotional hook */}
            <p className="font-display text-lg md:text-xl italic text-ink-faded mt-4 mb-6">
              {t('stories.newsletter.hook')}
            </p>

            {/* Decorative ornament */}
            <EditorialOrnament className="mb-8" prefersReducedMotion={prefersReducedMotion ?? false} />

            <AnimatePresence mode="wait">
              {!isSubscribed ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4 max-w-md mx-auto border-b border-warm-gray/40 pb-2"
                >
                  <VintageInput
                    type="email"
                    placeholder={t('stories.newsletter.placeholder')}
                    aria-label={t('stories.newsletter.placeholder')}
                    className="flex-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubscribe();
                    }}
                  />
                  <motion.button
                    onClick={handleSubscribe}
                    whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                    className="font-body text-caption tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors flex-shrink-0 min-h-[44px] px-4 py-3"
                  >
                    {t('stories.newsletter.subscribe')} &rarr;
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring', stiffness: 300, damping: 20 } })}
                  className="flex flex-col items-center gap-3 py-4"
                >
                  {/* Animated checkmark */}
                  <motion.svg
                    viewBox="0 0 40 40"
                    className="w-10 h-10"
                    aria-hidden="true"
                  >
                    <motion.circle
                      cx="20"
                      cy="20"
                      r="18"
                      fill="none"
                      stroke="currentColor"
                      className="text-rust"
                      strokeWidth="1.5"
                      {...(prefersReducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.6, ease: 'easeOut' } })}
                    />
                    <motion.path
                      d="M12 20 L18 26 L28 14"
                      fill="none"
                      stroke="currentColor"
                      className="text-rust"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      {...(prefersReducedMotion ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.4, delay: 0.4, ease: 'easeOut' } })}
                    />
                  </motion.svg>
                  <motion.p
                    {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.7, duration: 0.4 } })}
                    className="font-body text-body-sm text-ink-faded"
                  >
                    {t('stories.newsletter.success')}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SectionContainer>
      </section>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
