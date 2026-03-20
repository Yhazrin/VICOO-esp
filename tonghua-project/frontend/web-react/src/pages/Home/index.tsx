import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import ImpactCounter from '@/components/editorial/ImpactCounter';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import MagneticButton from '@/components/animations/MagneticButton';

export default function Home() {
  const { t } = useTranslation();

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
            className="inline-block font-body text-sm tracking-[0.15em] uppercase bg-ink text-paper px-8 py-4 hover:bg-rust transition-colors duration-300"
          >
            {t('home.hero.cta')}
          </Link>
        </MagneticButton>
      </EditorialHero>

      {/* Featured Campaigns Section */}
      <SectionContainer>
        <NumberedSectionHeading
          title={t('home.featured.sectionTitle')}
        />

        {/* Asymmetric grid placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <div className="md:col-span-7">
            <SepiaImageFrame
              src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80"
              alt="Children creating art"
              caption="Spring Campaign 2026 — Artwork Collection Phase"
              aspectRatio="landscape"
              size="full"
            />
          </div>
          <div className="md:col-span-5 flex flex-col justify-center">
            <h3 className="font-display text-h3 md:text-h2 font-bold text-ink leading-tight mb-4">
              Where Little Hands Shape Big Ideas
            </h3>
            <p className="font-body text-sm text-ink-faded leading-relaxed mb-6">
              Each campaign begins in a classroom, a community center, a shelter.
              We collect children's artwork — raw, honest, unfiltered — and transform
              it into sustainable fashion that funds their future.
            </p>
            <Link
              to="/campaigns"
              className="font-body text-xs text-rust tracking-[0.15em] uppercase hover:text-ink transition-colors"
            >
              {t('home.featured.viewAll')} &rarr;
            </Link>
          </div>
        </div>
      </SectionContainer>

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
        <NumberedSectionHeading
          title={t('home.impact.title')}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <ImpactCounter value={2847} label={t('home.impact.children')} />
          <ImpactCounter value={12563} label={t('home.impact.artworks')} />
          <ImpactCounter value={890000} label={t('home.impact.donated')} prefix="¥" />
          <ImpactCounter value={5420} label={t('home.impact.products')} />
        </div>
      </SectionContainer>

      {/* Children's Gallery */}
      <SectionContainer>
        <NumberedSectionHeading
          title={t('home.artworks.sectionTitle')}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80',
            'https://images.unsplash.com/photo-1560421683-6856ea585c78?w=400&q=80',
            'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&q=80',
            'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&q=80',
          ].map((src, i) => {
            const [imageLoaded, setImageLoaded] = useState(false);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="relative aspect-square overflow-hidden border-2 border-warm-gray/50 bg-aged-stock group"
              >
                {/* Grain overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none opacity-15" style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
                }} />

                {/* Sepia frame effect */}
                <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/8 via-transparent to-archive-brown/8" />

                {/* Decorative corner accents */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t border-l border-rust/40 z-20 pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b border-r border-rust/40 z-20 pointer-events-none" />

                {/* Loading skeleton */}
                {!imageLoaded && <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-square" />}

                <img
                  src={src}
                  alt={`Children's artwork ${i + 1}`}
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 sepia-[0.1] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                />
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/campaigns"
            className="font-body text-xs text-rust tracking-[0.15em] uppercase hover:text-ink transition-colors"
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
              <p className="font-body text-sm text-warm-gray leading-relaxed max-w-md">
                {t('home.cta.description')}
              </p>
            </div>
            <div className="flex flex-col gap-4 md:items-end">
              <MagneticButton strength={0.35}>
                <Link
                  to="/donate"
                  className="inline-block font-body text-sm tracking-[0.15em] uppercase bg-rust text-paper px-8 py-4 hover:bg-pale-gold hover:text-ink transition-all duration-300"
                >
                  {t('home.cta.donate')}
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.35}>
                <Link
                  to="/shop"
                  className="inline-block font-body text-sm tracking-[0.15em] uppercase border border-warm-gray/40 text-paper px-8 py-4 hover:border-pale-gold hover:text-pale-gold transition-all duration-300"
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

      {/* Bottom feature strip */}
      <SectionContainer>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-8"
        >
          <p className="font-body text-xs text-sepia-mid">
            Shanghai, China &mdash; Est. 2026
          </p>
        </motion.div>
      </SectionContainer>
    </PageWrapper>
  );
}
