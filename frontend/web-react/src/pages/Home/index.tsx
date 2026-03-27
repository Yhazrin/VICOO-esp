import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import ScrollNarrative from '@/components/scroll/ScrollNarrative';
import Planar3DScene from '@/components/scroll/Planar3DScene';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import MagneticButton from '@/components/animations/MagneticButton';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { KineticTextMarquee } from '@/components/animations/KineticMarquee';

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
      <SectionGrainOverlay className="z-10" />

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
        <SectionGrainOverlay className="z-10" />
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
  delay?: number;
}

function BrandPillar({ label, value, index, delay = 0 }: BrandPillarProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      {...(prefersReducedMotion ? {} : {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: {
          type: 'spring',
          stiffness: 380,
          damping: 30,
          delay: index * 0.1 + delay,
        },
      })}
      className="border-l border-sage/40 pl-6"
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
  const { scrollYProgress } = useScroll();

  // CTA section scroll-driven animations — headline fades up first
  const headlineOpacity = useTransform(
    scrollYProgress,
    [0.38, 0.48],
    prefersReducedMotion ? [1, 1] : [0, 1]
  );
  const headlineY = useTransform(
    scrollYProgress,
    [0.38, 0.48],
    prefersReducedMotion ? [0, 0] : [30, 0]
  );

  // Description fades up second
  const descOpacity = useTransform(
    scrollYProgress,
    [0.42, 0.52],
    prefersReducedMotion ? [1, 1] : [0, 1]
  );
  const descY = useTransform(
    scrollYProgress,
    [0.42, 0.52],
    prefersReducedMotion ? [0, 0] : [25, 0]
  );

  // Donate button scales in with spring
  const donateOpacity = useTransform(
    scrollYProgress,
    [0.46, 0.56],
    prefersReducedMotion ? [1, 1] : [0, 1]
  );
  const donateScale = useTransform(
    scrollYProgress,
    [0.46, 0.56],
    prefersReducedMotion ? [1, 1] : [0.8, 1]
  );

  // Shop button scales in slightly later
  const shopOpacity = useTransform(
    scrollYProgress,
    [0.50, 0.60],
    prefersReducedMotion ? [1, 1] : [0, 1]
  );
  const shopScale = useTransform(
    scrollYProgress,
    [0.50, 0.60],
    prefersReducedMotion ? [1, 1] : [0.8, 1]
  );

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
      {/* 3D Planar Scene - ambient background layer */}
      <Planar3DScene />

      {/* NEW: Scroll-driven narrative replacing static hero */}
      <ScrollNarrative />

      {/* Call to Action — scroll-driven fade in */}
      <section className="bg-ink text-paper section-spacing">
        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left column — text */}
            <motion.div style={{ opacity: headlineOpacity, y: headlineY }}>
              <h2 className="font-display text-h2 md:text-h1 font-bold leading-[0.95] mb-6">
                {t('home.cta.title')}
              </h2>
            </motion.div>

            <motion.div
              style={{ opacity: descOpacity, y: descY }}
              className="md:col-start-2 md:row-start-1"
            >
              <p className="font-body text-body-sm text-warm-gray leading-relaxed max-w-md">
                {t('home.cta.description')}
              </p>
            </motion.div>

            {/* Right column — buttons with spring scale animation */}
            <div className="flex flex-col gap-4 md:items-end md:col-start-2">
              <motion.div style={{ opacity: donateOpacity, scale: donateScale }}>
                <MagneticButton strength={0.35}>
                  <Link
                    to="/donate"
                    className="inline-block font-body text-body-sm tracking-[0.15em] uppercase bg-rust text-paper px-8 py-4 cursor-pointer hover:bg-pale-gold hover:text-ink transition-all duration-300"
                  >
                    {t('home.cta.donate')}
                  </Link>
                </MagneticButton>
              </motion.div>

              <motion.div style={{ opacity: shopOpacity, scale: shopScale }}>
                <MagneticButton strength={0.35}>
                  <Link
                    to="/shop"
                    className="inline-block font-body text-body-sm tracking-[0.15em] uppercase border border-sage/40 text-paper px-8 py-4 cursor-pointer hover:border-sage hover:text-sage-pale transition-all duration-300"
                  >
                    {t('home.cta.shop')}
                  </Link>
                </MagneticButton>
              </motion.div>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* Editorial Marquee — continuous motion strip */}
      <KineticTextMarquee
        items={[
          'Sustainable Fashion',
          "Children's Art",
          'Traceable Impact',
          'Community',
        ]}
        speed={0.6}
        className="border-y border-warm-gray/30"
      />

      {/* Editorial divider */}
      <div className="editorial-divider" aria-hidden="true" />

      {/* Bottom feature strip — 3 brand pillars with whileInView stagger */}
      <SectionContainer>
        <div className="py-12 md:py-16">
          <div className="flex items-baseline gap-3 mb-10">
            <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
              {t('common.location.shanghai')}
            </span>
            <span className="flex-1 h-px bg-warm-gray/40" />
            <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
              {t('home.est')}
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
        </div>
      </SectionContainer>
    </PageWrapper>
  );
}
