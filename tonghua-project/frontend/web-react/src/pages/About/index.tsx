import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import ImageSkeleton from '@/components/editorial/ImageSkeleton';
import { ScrollPathDrawInline } from '@/components/animations/ScrollPathDraw';

const VALUES = ['transparency', 'childFirst', 'sustainability', 'community'] as const;

const TEAM_MEMBERS = [
  { name: 'Chen Wei', roleKey: 'founder', initials: 'CW' },
  { name: 'Li Mei', roleKey: 'operations', initials: 'LM' },
  { name: 'Zhang Hua', roleKey: 'design', initials: 'ZH' },
  { name: 'Wang Jun', roleKey: 'supplyChain', initials: 'WJ' },
];

/* ─── Team Member Card (extracted to fix hooks-in-loops) ─── */

interface TeamMemberCardProps {
  name: string;
  roleKey: string;
  initials: string;
  imageIndex: number;
}

function TeamMemberCard({ name, roleKey, initials, imageIndex }: TeamMemberCardProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } })}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: imageIndex * 0.1 }}
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      className="group"
    >
      <div className="relative aspect-[3/4] overflow-hidden border-2 border-warm-gray/50 bg-aged-stock mb-4">
        {/* Grain overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.06]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
        }} aria-hidden="true" />

        {/* Sepia frame effect */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-br from-pale-gold/5 via-transparent to-archive-brown/5" aria-hidden="true" />

        {/* Decorative corner accents */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-rust/30 z-20 pointer-events-none" aria-hidden="true" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-rust/30 z-20 pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-rust/30 z-20 pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-rust/30 z-20 pointer-events-none" aria-hidden="true" />

        {/* Loading skeleton */}
        {!imageLoaded && !imgError && <ImageSkeleton className="absolute inset-0" aspectRatio="aspect-[3/4]" />}

        {/* Fallback initials placeholder */}
        {imgError && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-aged-stock">
            <span className="font-display text-4xl font-bold text-rust/40">
              {initials}
            </span>
          </div>
        )}

        <img
          src={`https://picsum.photos/seed/vicoo-team-${imageIndex}/400/533`}
          alt={name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 sepia-[0.05] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImgError(true)}
        />
      </div>
      <h4 className="font-display text-base font-semibold text-ink group-hover:text-rust transition-colors">
        {name}
      </h4>
      <p className="font-body text-caption text-sepia-mid mt-1">{t(`about.team.roles.${roleKey}`)}</p>
    </motion.div>
  );
}

export default function About() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageWrapper>
      <EditorialHero
        title={t('about.hero.title')}
        subtitle={t('about.hero.subtitle')}
        fullHeight={true}
        scrambleTitle={true}
        scrambleDuration={1200}
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
          <div className="md:col-span-7 md:pt-8 relative">
            {/* Decorative vertical line alongside mission text */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-sage/40 via-sage/20 to-transparent" aria-hidden="true" />
            <p className="font-body text-base md:text-lg text-ink-faded leading-[1.85] editorial-drop-cap pl-6">
              {t('about.mission.body')}
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Decorative scroll-drawn flourish */}
      <div className="flex justify-center py-6" aria-hidden="true">
        <ScrollPathDrawInline
          path="M0,15 Q50,0 100,15 T200,15 T300,15 T400,15"
          strokeColor="var(--color-rust)"
          strokeWidth={1}
          className="w-80 h-8 opacity-60"
        />
      </div>

      {/* Image interlude */}
      <SectionContainer>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            <SepiaImageFrame
              src="https://picsum.photos/seed/vicoo-workshop/1000/563"
              alt={t('about.images.workshop.alt')}
              caption={t('about.images.workshop.caption')}
              aspectRatio="wide"
              size="full"
            />
          </div>
          <div className="md:col-span-4 flex items-end">
            <SepiaImageFrame
              src="https://picsum.photos/seed/vicoo-supplies/500/667"
              alt={t('about.images.supplies.alt')}
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
          {VALUES.map((key, i) => (
            <motion.article
              key={key}
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-50px' }, transition: { duration: 0.5, delay: i * 0.12 } })}
              whileHover={prefersReducedMotion ? undefined : { y: -3 }}
              className="border-t border-sage/20 pt-6 cursor-default"
            >
              <h3 className="font-display text-h3 font-bold text-ink mb-3">
                {t(`about.values.${key}.title`)}
              </h3>
              <p className="font-body text-body-sm text-ink-faded leading-relaxed">
                {t(`about.values.${key}.body`)}
              </p>
            </motion.article>
          ))}
        </div>
      </SectionContainer>

      {/* Quote */}
      <SectionContainer narrow>
        <StoryQuoteBlock
          quote={t('about.quote.body')}
          author={t('about.quote.author')}
          role={t('about.quote.role')}
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
          {TEAM_MEMBERS.map((member, i) => (
            <TeamMemberCard
              key={member.roleKey}
              name={member.name}
              roleKey={member.roleKey}
              initials={member.initials}
              imageIndex={i}
            />
          ))}
        </div>
      </SectionContainer>

      <div className="editorial-divider" aria-hidden="true" />
    </PageWrapper>
  );
}
