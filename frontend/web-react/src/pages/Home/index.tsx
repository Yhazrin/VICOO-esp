import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import ScrollNarrative from '@/components/scroll/ScrollNarrative';
import Planar3DScene from '@/components/scroll/Planar3DScene';
import MagneticButton from '@/components/animations/MagneticButton';
import { KineticTextMarquee } from '@/components/animations/KineticMarquee';
import { artworksApi } from '@/services/artworks';
import { donationsApi } from '@/services/donations';
import { allowWebMockFallback } from '@/config/runtime';

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
  const { data: homeLiveStats } = useQuery({
    queryKey: ['home-live-stats'],
    queryFn: async () => {
      try {
        const [artworks, donations] = await Promise.all([
          artworksApi.getAll({ page_size: 1 }),
          donationsApi.getImpactStats(),
        ]);
        return {
          totalArtworks: artworks.total ?? 0,
          totalDonations: Number(donations.total_amount ?? 0),
          source: 'live' as const,
        };
      } catch {
        if (!allowWebMockFallback) {
          throw new Error('Home metrics unavailable and fallback disabled');
        }
        return {
          totalArtworks: 2847,
          totalDonations: 890000,
          source: 'fallback' as const,
        };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

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

  const brandPillars = [
    { label: t('home.pillars.traceable'), value: '100%' },
    { label: t('home.pillars.children'), value: (homeLiveStats?.totalArtworks ?? 2847).toLocaleString() },
    { label: t('home.pillars.reinvested'), value: Math.round(homeLiveStats?.totalDonations ?? 890000).toLocaleString() },
  ];
  const sourceLabel = homeLiveStats?.source === 'live'
    ? t('home.metricsSource.live', 'Live API')
    : t('home.metricsSource.fallback', 'Fallback Data');

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
          <p className="mt-8 font-body text-caption tracking-[0.1em] uppercase text-sepia-mid">
            {t('home.metricsSource.label', 'Metrics Source')}: {sourceLabel}
          </p>
        </div>
      </SectionContainer>
    </PageWrapper>
  );
}
