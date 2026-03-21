import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import ImpactCounter from '@/components/editorial/ImpactCounter';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import MagneticButton from '@/components/animations/MagneticButton';
import { ScrollPathDrawInline } from '@/components/animations/ScrollPathDraw';

/* ─── Gallery Item (extracted to fix useState-in-map bug) ─── */

interface GalleryItemProps {
  src: string;
  alt: string;
  index: number;
}

function GalleryItem({ src, alt, index }: GalleryItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } })}
      viewport={{ once: true }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 30,
        delay: index * 0.08,
      }}
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      className="relative aspect-square overflow-hidden border-2 border-warm-gray/50 bg-aged-stock group"
    >
      {/* Grain overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
        aria-hidden="true"
      />

      {/* Sepia frame effect */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/8 via-transparent to-archive-brown/8" aria-hidden="true" />

      {/* Decorative corner accents */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t border-l border-rust/30 z-20 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b border-r border-rust/30 z-20 pointer-events-none" aria-hidden="true" />

      {/* Loading skeleton */}
      {!imageLoaded && (
        <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-square" />
      )}

      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 sepia-[0.1] ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
      />
    </motion.div>
  );
}

/* ─── Latest Artwork Card ─── */

interface LatestArtworkCardProps {
  src: string;
  childName: string;
  campaignName: string;
  date: string;
  index: number;
  wide?: boolean;
}

function LatestArtworkCard({
  src,
  childName,
  campaignName,
  date,
  index,
  wide = false,
}: LatestArtworkCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 } })}
      viewport={{ once: true }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 30,
        delay: index * 0.12,
      }}
      className={`group ${wide ? 'md:col-span-2' : 'md:col-span-1'}`}
    >
      <div
        className={`relative overflow-hidden border border-warm-gray/60 bg-aged-stock ${
          wide ? 'aspect-[16/10]' : 'aspect-[3/4]'
        }`}
      >
        {/* Grain overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/5 via-transparent to-archive-brown/5" aria-hidden="true" />

        {!imageLoaded && (
          <ImageSkeleton
            className="absolute inset-0"
            aspectRatio={wide ? 'aspect-[16/10]' : 'aspect-[3/4]'}
          />
        )}

        <img
          src={src}
          alt={`Artwork by ${childName}`}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 sepia-[0.1] ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="font-display text-body-sm font-semibold text-ink leading-snug">
            {childName}
          </p>
          <p className="font-body text-caption text-ink-faded mt-1">{campaignName}</p>
        </div>
        <span className="font-body text-caption text-sepia-mid tracking-[0.1em] whitespace-nowrap">
          {date}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Brand Pillar ─── */

interface BrandPillarProps {
  label: string;
  value: string;
  index: number;
}

function BrandPillar({ label, value, index }: BrandPillarProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      {...(prefersReducedMotion ? {} : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: {
          type: 'spring',
          stiffness: 380,
          damping: 30,
          delay: index * 0.1,
        },
      })}
      className="border-l border-warm-gray/40 pl-6"
    >
      <p className="font-display text-h3 md:text-h2 font-bold text-ink leading-[0.95]">
        {value}
      </p>
      <p className="font-body text-caption text-sepia-mid tracking-[0.12em] uppercase mt-2">
        {label}
      </p>
    </motion.div>
  );
}

/* ─── Home Page ─── */

export default function Home() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const galleryImages = [
    { src: 'https://picsum.photos/seed/children-art-1/400/400', alt: t('home.gallery.alt.watercolor') },
    { src: 'https://picsum.photos/seed/children-art-2/400/400', alt: t('home.gallery.alt.crayon') },
    { src: 'https://picsum.photos/seed/children-art-3/400/400', alt: t('home.gallery.alt.pastel') },
    { src: 'https://picsum.photos/seed/children-art-4/400/400', alt: t('home.gallery.alt.ink') },
  ];

  const latestArtworks = [
    {
      src: 'https://picsum.photos/seed/spring-bloom-art/800/500',
      childName: 'Lin Xiaomei',
      campaignName: 'Spring Bloom Campaign',
      date: 'Mar 2026',
    },
    {
      src: 'https://picsum.photos/seed/ocean-dreams-art/400/533',
      childName: 'Zhang Yufei',
      campaignName: 'Ocean Dreams',
      date: 'Feb 2026',
    },
    {
      src: 'https://picsum.photos/seed/mountain-song-art/400/533',
      childName: 'Wang Haoran',
      campaignName: 'Mountain Song',
      date: 'Jan 2026',
    },
  ];

  const brandPillars = [
    { label: t('home.pillars.traceable'), value: '100%' },
    { label: t('home.pillars.children'), value: '2,847' },
    { label: t('home.pillars.reinvested'), value: '890,000' },
  ];

  return (
    <PageWrapper>
      {/* Hero */}
      <EditorialHero
        title={t('home.hero.title')}
        subtitle={t('home.hero.subtitle')}
        scrambleTitle={true}
        scrambleDuration={1400}
      >
        <MagneticButton strength={0.4}>
          <Link
            to="/campaigns"
            className="inline-block font-body text-body-sm tracking-[0.15em] uppercase bg-ink text-paper px-8 py-4 cursor-pointer hover:bg-rust transition-colors duration-300"
          >
            {t('home.hero.cta')}
          </Link>
        </MagneticButton>
      </EditorialHero>

      {/* Featured Campaigns Section */}
      <SectionContainer>
        <NumberedSectionHeading number="01" title={t('home.featured.sectionTitle')} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <div className="md:col-span-7">
            <SepiaImageFrame
              src="https://picsum.photos/seed/spring-campaign/800/600"
              alt={t('home.featured.imageAlt')}
              caption={t('home.featured.caption')}
              aspectRatio="landscape"
              size="full"
            />
          </div>
          <div className="md:col-span-5 flex flex-col justify-center">
            <h3 className="font-display text-h3 md:text-h2 font-bold text-ink leading-tight mb-4">
              {t('home.featured.heading')}
            </h3>
            <p className="font-body text-body-sm text-ink-faded leading-relaxed mb-6">
              {t('home.featured.body')}
            </p>
            <Link
              to="/campaigns"
              className="font-body text-caption text-rust tracking-[0.15em] uppercase cursor-pointer hover:text-ink transition-colors"
            >
              {t('home.featured.viewAll')} &rarr;
            </Link>
          </div>
        </div>
      </SectionContainer>

      {/* Scroll-drawn page turn connector */}
      <div className="flex justify-center py-2" aria-hidden="true">
        <ScrollPathDrawInline
          path="M0,10 L60,10 M80,10 L140,10 M160,10 L220,10"
          strokeColor="var(--color-warm-gray, #D4CFC4)"
          strokeWidth={1}
          className="w-56 h-5"
        />
      </div>

      {/* Quote Interlude */}
      <SectionContainer narrow>
        <StoryQuoteBlock
          quote="Every stitch carries a child's dream. Every garment is a chapter in a story that hasn't been written yet."
          author="Chen Wei"
          role="Founder, VICOO"
        />
      </SectionContainer>

      {/* Impact Numbers */}
      <SectionContainer>
        <NumberedSectionHeading number="02" title={t('home.impact.title')} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <ImpactCounter value={2847} label={t('home.impact.children')} />
          <ImpactCounter value={12563} label={t('home.impact.artworks')} />
          <ImpactCounter value={890000} label={t('home.impact.donated')} prefix="¥" />
          <ImpactCounter value={5420} label={t('home.impact.products')} />
        </div>
      </SectionContainer>

      {/* Latest Artworks */}
      <SectionContainer>
        <NumberedSectionHeading number="03" title={t('home.latestArtworks.sectionTitle')} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {latestArtworks.map((artwork, i) => (
            <LatestArtworkCard
              key={artwork.campaignName}
              src={artwork.src}
              childName={artwork.childName}
              campaignName={artwork.campaignName}
              date={artwork.date}
              index={i}
              wide={i === 0}
            />
          ))}
        </div>
      </SectionContainer>

      {/* Children's Gallery */}
      <SectionContainer>
        <NumberedSectionHeading number="04" title={t('home.artworks.sectionTitle')} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {galleryImages.map((img, i) => (
            <GalleryItem
              key={img.src}
              src={img.src}
              alt={img.alt}
              index={i}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/campaigns"
            className="font-body text-caption text-rust tracking-[0.15em] uppercase cursor-pointer hover:text-ink transition-colors"
          >
            {t('home.artworks.viewAll')} &rarr;
          </Link>
        </div>
      </SectionContainer>

      {/* Call to Action */}
      <section className="bg-ink text-paper section-spacing">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-h2 md:text-h1 font-bold leading-[0.95] mb-6">
                {t('home.cta.title')}
              </h2>
              <p className="font-body text-body-sm text-warm-gray leading-relaxed max-w-md">
                {t('home.cta.description')}
              </p>
            </div>
            <div className="flex flex-col gap-4 md:items-end">
              <MagneticButton strength={0.35}>
                <Link
                  to="/donate"
                  className="inline-block font-body text-body-sm tracking-[0.15em] uppercase bg-rust text-paper px-8 py-4 cursor-pointer hover:bg-pale-gold hover:text-ink transition-all duration-300"
                >
                  {t('home.cta.donate')}
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.35}>
                <Link
                  to="/shop"
                  className="inline-block font-body text-body-sm tracking-[0.15em] uppercase border border-warm-gray/40 text-paper px-8 py-4 cursor-pointer hover:border-pale-gold hover:text-pale-gold transition-all duration-300"
                >
                  {t('home.cta.shop')}
                </Link>
              </MagneticButton>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* Editorial divider before footer */}
      <div className="editorial-divider" />

      {/* Bottom feature strip — 3 brand pillars */}
      <SectionContainer>
        <motion.div
          {...(prefersReducedMotion ? {} : { initial: { opacity: 0 }, whileInView: { opacity: 1 } })}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-12 md:py-16"
        >
          <div className="flex items-baseline gap-3 mb-10">
            <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
              {t('common.location.shanghai')}
            </span>
            <span className="flex-1 h-px bg-warm-gray/40" />
            <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
              Est. 2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {brandPillars.map((pillar, i) => (
              <BrandPillar
                key={pillar.label}
                label={pillar.label}
                value={pillar.value}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      </SectionContainer>
    </PageWrapper>
  );
}
