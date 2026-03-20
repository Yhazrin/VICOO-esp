import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
  coverImage: string;
  author: string;
  publishedAt: string;
  readTimeMinutes: number;
  category: 'impact' | 'fashion' | 'community' | 'education';
}

// Marquee quotes from stories
const STORY_QUOTES = [
  'Every brushstroke a child makes is a window into a world they imagine',
  'We don\'t just sell clothes, we sell the right to know where it came from',
  'Sustainability begins with seeing, not just buying',
  'A classroom becomes a gallery when we open the doors',
  'The ocean she painted was the bluest thing she had ever seen',
];

const MOCK_STORIES: StoryItem[] = [
  {
    id: '1',
    title: 'The Girl Who Drew the Ocean',
    excerpt: 'Xiao Lin had never seen the sea. But her painting of it became the most popular design in our Spring collection.',
    coverImage: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
    author: 'Chen Wei',
    publishedAt: '2026-02-15',
    readTimeMinutes: 8,
    category: 'impact',
  },
  {
    id: '2',
    title: 'From Waste to Wearable',
    excerpt: 'How our production team turns deadstock fabric into limited-edition pieces that fund art workshops.',
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    author: 'Zhang Hua',
    publishedAt: '2026-02-01',
    readTimeMinutes: 12,
    category: 'fashion',
  },
  {
    id: '3',
    title: 'A Classroom Becomes a Gallery',
    excerpt: 'When Dongfeng Elementary opened its doors for our workshop, nobody expected the walls to become canvases.',
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
    author: 'Li Mei',
    publishedAt: '2026-01-20',
    readTimeMinutes: 6,
    category: 'community',
  },
  {
    id: '4',
    title: 'Teaching Sustainability Through Art',
    excerpt: 'Our new curriculum helps children understand environmental impact through creative expression.',
    coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    author: 'Wang Jun',
    publishedAt: '2026-01-10',
    readTimeMinutes: 10,
    category: 'education',
  },
  {
    id: '5',
    title: 'The Numbers Behind the Mission',
    excerpt: 'A transparent look at how every yuan of donation translates into real-world impact for children and communities.',
    coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    author: 'Chen Wei',
    publishedAt: '2025-12-28',
    readTimeMinutes: 15,
    category: 'impact',
  },
];

export default function Stories() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const categories: Category[] = ['all', 'impact', 'fashion', 'community', 'education'];
  const filtered = activeCategory === 'all'
    ? MOCK_STORIES
    : MOCK_STORIES.filter((s) => s.category === activeCategory);

  return (
    <PageWrapper>
      <EditorialHero
        title={t('stories.hero.title')}
        subtitle={t('stories.hero.subtitle')}
        hideHero={true}
      />

      {/* Kinetic marquee with story quotes */}
      <KineticTextMarquee
        items={STORY_QUOTES}
        direction="left"
        speed={0.8}
        pauseOnHover={true}
      />

      <SectionContainer noTopSpacing>
        {/* Category filter */}
        <div className="flex items-center gap-1 mb-12 border-b border-warm-gray/30 overflow-x-auto">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -2 }}
              className={`
                font-body text-xs tracking-[0.15em] uppercase px-4 py-3 transition-all duration-200 border-b-2 -mb-px whitespace-nowrap relative
                ${activeCategory === cat
                  ? 'border-rust text-rust'
                  : 'border-transparent text-sepia-mid hover:text-ink'
                }
              `}
            >
              {t(`stories.categories.${cat}`)}
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
        {filtered.length > 0 ? (
          <div className="space-y-0">
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
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
                  >
                    <Link to={`/stories/${story.id}`} className="group block">
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
                          <span className="font-body text-[10px] text-rust tracking-[0.25em] uppercase mb-4 block">
                            {t(`stories.categories.${story.category}`)}
                          </span>

                          <h2 className="font-display text-h3 md:text-h2 font-bold text-ink mb-4 group-hover:text-rust transition-colors leading-tight">
                            {story.title}
                          </h2>

                          <p className="font-body text-sm text-ink-faded leading-relaxed mb-6">
                            {story.excerpt}
                          </p>

                          <div className="flex items-center gap-4 font-body text-xs text-sepia-mid">
                            <span>{story.author}</span>
                            <span className="text-sepia-mid/40">|</span>
                            <span>{story.readTimeMinutes} {t('stories.readTime')}</span>
                            <span className="text-sepia-mid/40">|</span>
                            <span>{story.publishedAt}</span>
                          </div>

                          {/* Read more link */}
                          <div className="mt-6">
                            <span className="font-body text-xs text-rust tracking-[0.15em] uppercase group-hover:text-ink transition-colors">
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
          </div>
        ) : (
          <p className="font-body text-sm text-sepia-mid py-20 text-center">
            {t('stories.empty')}
          </p>
        )}
      </SectionContainer>

      {/* Newsletter CTA */}
      <section className="bg-aged-stock section-spacing">
        <SectionContainer narrow>
          <div className="text-center">
            <NumberedSectionHeading
              title={t('stories.newsletter.title')}
              subtitle={t('stories.newsletter.subtitle')}
            />
            <div className="mt-8 flex items-center gap-4 max-w-md mx-auto border-b border-warm-gray/40 pb-2">
              <VintageInput
                type="email"
                placeholder={t('stories.newsletter.placeholder')}
                className="flex-1"
              />
              <button className="font-body text-xs tracking-[0.15em] uppercase text-rust hover:text-ink transition-colors flex-shrink-0">
                {t('stories.newsletter.subscribe')} &rarr;
              </button>
            </div>
          </div>
        </SectionContainer>
      </section>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
