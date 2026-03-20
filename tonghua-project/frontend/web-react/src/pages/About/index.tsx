import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';

const VALUES = ['transparency', 'childFirst', 'sustainability', 'community'] as const;

export default function About() {
  const { t } = useTranslation();

  return (
    <PageWrapper>
      <EditorialHero
        number="02"
        title={t('about.hero.title')}
        subtitle={t('about.hero.subtitle')}
        fullHeight={true}
      />

      {/* Mission */}
      <SectionContainer noTopSpacing>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-5">
            <NumberedSectionHeading
              number="01"
              title={t('about.mission.title')}
            />
          </div>
          <div className="md:col-span-7 md:pt-8">
            <p className="font-body text-base md:text-lg text-ink-faded leading-[1.85] editorial-drop-cap">
              {t('about.mission.body')}
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Image interlude */}
      <SectionContainer>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            <SepiaImageFrame
              src="https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=1000&q=80"
              alt="Children in a workshop"
              caption="A Saturday workshop in Shanghai — where it all begins"
              aspectRatio="wide"
              size="full"
            />
          </div>
          <div className="md:col-span-4 flex items-end">
            <SepiaImageFrame
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=80"
              alt="Art supplies"
              aspectRatio="portrait"
              size="full"
            />
          </div>
        </div>
      </SectionContainer>

      {/* Values */}
      <SectionContainer>
        <NumberedSectionHeading
          number="02"
          title={t('about.values.title')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {VALUES.map((key, index) => (
            <article key={key} className="border-t border-warm-gray/30 pt-6">
              <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-h3 font-bold text-ink mt-2 mb-3">
                {t(`about.values.${key}.title`)}
              </h3>
              <p className="font-body text-sm text-ink-faded leading-relaxed">
                {t(`about.values.${key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </SectionContainer>

      {/* Quote */}
      <SectionContainer narrow>
        <StoryQuoteBlock
          quote="We don't just sell clothes. We sell the right to say: I know where this came from, and it came from somewhere good."
          author="Li Mei"
          role="Head of Operations"
        />
      </SectionContainer>

      {/* Team */}
      <SectionContainer>
        <NumberedSectionHeading
          number="03"
          title={t('about.team.title')}
          subtitle={t('about.team.subtitle')}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            { name: 'Chen Wei', role: 'Founder & Director' },
            { name: 'Li Mei', role: 'Head of Operations' },
            { name: 'Zhang Hua', role: 'Design Lead' },
            { name: 'Wang Jun', role: 'Supply Chain Manager' },
          ].map((member, i) => {
            const [imageLoaded, setImageLoaded] = useState(false);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <div className="relative aspect-[3/4] overflow-hidden border-2 border-warm-gray/50 bg-aged-stock mb-4">
                  {/* Grain overlay */}
                  <div className="absolute inset-0 z-10 pointer-events-none opacity-12" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
                  }} />

                  {/* Sepia frame effect */}
                  <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/5 via-transparent to-archive-brown/5" />

                  {/* Decorative corner accents */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-rust/30 z-20 pointer-events-none" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-rust/30 z-20 pointer-events-none" />

                  {/* Loading skeleton */}
                  {!imageLoaded && <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-[3/4]" />}

                  <img
                    src={`https://images.unsplash.com/photo-${1507000000000 + i * 100000}-000000000000?w=400&q=80`}
                    alt={member.name}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 sepia-[0.05] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <h4 className="font-display text-base font-semibold text-ink group-hover:text-rust transition-colors">
                  {member.name}
                </h4>
                <p className="font-body text-xs text-sepia-mid mt-1">{member.role}</p>
              </motion.div>
            );
          })}
        </div>
      </SectionContainer>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
