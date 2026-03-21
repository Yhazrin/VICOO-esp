import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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

// Marquee quotes with attribution
const STORY_QUOTES = [
  { text: 'Every brushstroke a child makes is a window into a world they imagine', attribution: 'Chen Wei, Founder' },
  { text: 'We don\'t just sell clothes, we sell the right to know where it came from', attribution: 'Zhang Hua, Production Lead' },
  { text: 'Sustainability begins with seeing, not just buying', attribution: 'Li Mei, Community Director' },
  { text: 'A classroom becomes a gallery when we open the doors', attribution: 'Wang Jun, Education Lead' },
  { text: 'The ocean she painted was the bluest thing she had ever seen', attribution: 'Chen Wei, Founder' },
];

const MOCK_STORIES: StoryItem[] = [
  {
    id: '1',
    title: 'The Girl Who Drew the Ocean',
    excerpt: 'Xiao Lin had never seen the sea. But her painting of it became the most popular design in our Spring collection.',
    pullQuote: '47 children participated in this workshop',
    coverImage: 'https://picsum.photos/seed/ocean-girl/800/600',
    author: 'Chen Wei',
    publishedAt: '2026-02-15',
    readTimeMinutes: 8,
    category: 'impact',
  },
  {
    id: '2',
    title: 'From Waste to Wearable',
    excerpt: 'How our production team turns deadstock fabric into limited-edition pieces that fund art workshops.',
    pullQuote: '3.2 tonnes of fabric diverted from landfill',
    coverImage: 'https://picsum.photos/seed/waste-wearable/800/600',
    author: 'Zhang Hua',
    publishedAt: '2026-02-01',
    readTimeMinutes: 12,
    category: 'fashion',
  },
  {
    id: '3',
    title: 'A Classroom Becomes a Gallery',
    excerpt: 'When Dongfeng Elementary opened its doors for our workshop, nobody expected the walls to become canvases.',
    pullQuote: '120 artworks created in a single afternoon',
    coverImage: 'https://picsum.photos/seed/classroom-gallery/800/600',
    author: 'Li Mei',
    publishedAt: '2026-01-20',
    readTimeMinutes: 6,
    category: 'community',
  },
  {
    id: '4',
    title: 'Teaching Sustainability Through Art',
    excerpt: 'Our new curriculum helps children understand environmental impact through creative expression.',
    pullQuote: '14 schools adopted the curriculum this semester',
    coverImage: 'https://picsum.photos/seed/sustainability-art/800/600',
    author: 'Wang Jun',
    publishedAt: '2026-01-10',
    readTimeMinutes: 10,
    category: 'education',
  },
  {
    id: '5',
    title: 'The Numbers Behind the Mission',
    excerpt: 'A transparent look at how every yuan of donation translates into real-world impact for children and communities.',
    pullQuote: '92% of funds go directly to programs',
    coverImage: 'https://picsum.photos/seed/numbers-mission/800/600',
    author: 'Chen Wei',
    publishedAt: '2025-12-28',
    readTimeMinutes: 15,
    category: 'impact',
  },
];

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
        stroke="#8B3A2A"
        strokeWidth="0.5"
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
        stroke="#8B3A2A"
        strokeWidth="0.75"
        {...(prefersReducedMotion ? {} : {
          initial: { scale: 0 },
          whileInView: { scale: 1 },
          viewport: { once: true },
          transition: { duration: 0.5, delay: 0.5, type: 'spring' as const, stiffness: 300 },
        })}
      />
      <motion.circle
        cx="100" cy="12" r="1.5"
        fill="#8B3A2A"
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
        stroke="#8B3A2A"
        strokeWidth="0.75"
        {...(prefersReducedMotion ? {} : {
          initial: { scale: 0 },
          whileInView: { scale: 1 },
          viewport: { once: true },
          transition: { duration: 0.5, delay: 0.9, type: 'spring' as const, stiffness: 300 },
        })}
      />
      <motion.line
        x1="130" y1="12" x2="200" y2="12"
        stroke="#8B3A2A"
        strokeWidth="0.5"
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
function ReadingProgressBar({ readTimeMinutes, prefersReducedMotion = false }: { readTimeMinutes: number; prefersReducedMotion?: boolean }) {
  const maxReadTime = 20;
  const widthPercent = Math.min((readTimeMinutes / maxReadTime) * 100, 100);

  return (
    <div className="mt-4 h-[2px] w-full bg-warm-gray/20 rounded-sm overflow-hidden">
      <motion.div
        className="h-full bg-rust/60 rounded-sm"
        initial={{ width: 0 }}
        {...(prefersReducedMotion ? {} : {
          whileInView: { width: `${widthPercent}%` },
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
          <line x1="88" y1="38" x2="98" y2="22" stroke="#8B3A2A" strokeWidth="1.5" strokeLinecap="round" />
          <polygon points="98,22 100,19 96,19" fill="#8B3A2A" />
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
        className="font-body text-caption tracking-[0.15em] uppercase text-rust border-b border-rust/30 pb-1 hover:text-ink hover:border-ink/30 transition-colors"
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

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = {
      all: MOCK_STORIES.length,
      impact: 0,
      fashion: 0,
      community: 0,
      education: 0,
    };
    for (const story of MOCK_STORIES) {
      counts[story.category]++;
    }
    return counts;
  }, []);

  const filtered = activeCategory === 'all'
    ? MOCK_STORIES
    : MOCK_STORIES.filter((s) => s.category === activeCategory);

  const handleSubscribe = () => {
    if (email.trim()) {
      setIsSubscribed(true);
    }
  };

  return (
    <PageWrapper>
      <EditorialHero
        title={t('stories.hero.title')}
        subtitle={t('stories.hero.subtitle')}
        hideHero={true}
      />

      {/* Kinetic marquee with attributed quotes */}
      <KineticTextMarquee
        items={STORY_QUOTES.map((q) => `${q.text} — ${q.attribution}`)}
        direction="left"
        speed={0.8}
        pauseOnHover={true}
      />

      <SectionContainer noTopSpacing>
        {/* Category filter with count badges */}
        <div className="flex items-center gap-1 mb-12 border-b border-warm-gray/30 overflow-x-auto">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              className={`
                font-body text-caption tracking-[0.15em] uppercase px-4 py-3 transition-all duration-200 border-b-2 -mb-px whitespace-nowrap relative
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
                      : 'bg-warm-gray/20 text-sepia-mid/60'
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
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
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
                      initial={{ opacity: 0, y: 50 }}
                      {...(prefersReducedMotion ? {} : {
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: true, margin: '-100px' },
                        transition: { duration: 0.8, ease: [0, 0, 0.2, 1] },
                      })}
                    >
                      <Link to={`/stories/${story.id}`} className="group block cursor-pointer">
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
                            <ReadingProgressBar readTimeMinutes={story.readTimeMinutes} prefersReducedMotion={prefersReducedMotion ?? false} />

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
                              quote="Every brushstroke a child makes is a window into a world they imagine. Our job is to make that world visible."
                              author="Chen Wei"
                              role="Founder, VICOO"
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
                    className="font-body text-caption tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors flex-shrink-0"
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
