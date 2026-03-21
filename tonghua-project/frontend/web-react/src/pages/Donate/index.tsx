import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import DonationPanel from '@/components/editorial/DonationPanel';
import ImpactCounter from '@/components/editorial/ImpactCounter';
import FAQAccordion from '@/components/editorial/FAQAccordion';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import MagneticButton from '@/components/animations/MagneticButton';
import { donationsApi } from '@/services/donations';

/* ─── Impact Area Data ─── */

const IMPACT_AREAS = [
  { key: 'artSupplies', pct: 60, icon: 'brush' },
  { key: 'production', pct: 20, icon: 'fabric' },
  { key: 'operations', pct: 15, icon: 'gear' },
  { key: 'community', pct: 5, icon: 'heart' },
];

/* ─── Impact Icon ─── */

function ImpactIcon({ type }: { type: string }) {
  const icons: Record<string, JSX.Element> = {
    brush: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18.37 2.63a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12L9.12 17.88a4 4 0 0 1-2.83 1.17H4v-2.25a4 4 0 0 1 1.17-2.83L17.42 1.68z" />
        <path d="M4 20h4" />
      </svg>
    ),
    fabric: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </svg>
    ),
    gear: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    heart: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  };
  return <span className="text-rust/60">{icons[type] || null}</span>;
}

/* ─── Impact Progress Bar ─── */

function ImpactProgressBar({
  label,
  description,
  pct,
  icon,
  index,
  prefersReducedMotion,
}: {
  label: string;
  description: string;
  pct: number;
  icon: string;
  index: number;
  prefersReducedMotion: boolean | null;
}) {
  return (
    <motion.div
      {...(prefersReducedMotion ? {} : {
        initial: { opacity: 0, x: -20 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true },
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
          delay: index * 0.12,
        },
      })}
    >
      <div className="flex items-center gap-3 mb-2">
        <ImpactIcon type={icon} />
        <div className="flex-1 flex items-baseline justify-between">
          <span className="font-body text-body-sm text-ink font-medium">
            {label}
          </span>
          <span className="font-display text-body-sm font-bold text-rust">
            {pct}%
          </span>
        </div>
      </div>
      <div className="h-2 bg-warm-gray/15 rounded-sm overflow-hidden">
        <motion.div
          {...(prefersReducedMotion ? {} : {
            initial: { scaleX: 0 },
            whileInView: { scaleX: pct / 100 },
            viewport: { once: true },
            transition: {
              type: 'spring',
              stiffness: 80,
              damping: 20,
              delay: index * 0.12 + 0.2,
            },
          })}
          className="h-full rounded-sm origin-left"
          style={{
            background: 'linear-gradient(90deg, color-mix(in srgb, var(--color-rust) 50%, transparent), color-mix(in srgb, var(--color-rust) 80%, transparent))',
            ...(prefersReducedMotion ? { width: `${pct}%` } : {}),
          }}
        />
      </div>
      <p className="font-body text-caption text-ink-faded mt-1.5 leading-relaxed pl-8">
        {description}
      </p>
    </motion.div>
  );
}

/* ─── Trust Badge ─── */

function TrustBadge({ label, index, prefersReducedMotion }: { label: string; index: number; prefersReducedMotion: boolean | null }) {
  return (
    <motion.div
      {...(prefersReducedMotion ? {} : {
        initial: { opacity: 0, y: 10 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: {
          type: 'spring',
          stiffness: 380,
          damping: 30,
          delay: index * 0.08,
        },
      })}
      className="flex items-center gap-2 border border-warm-gray/30 px-4 py-2.5 bg-paper"
    >
      <span className="w-2 h-2 bg-sage/60 rounded-sm" />
      <span className="font-body text-caption text-ink tracking-[0.08em] uppercase">
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Donation Story Card ─── */

function DonationStoryCard({
  amount,
  impact,
  caption,
  imageSeed,
  index,
}: {
  amount: string;
  impact: string;
  caption: string;
  imageSeed: string;
  index: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
      whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 30,
        delay: index * 0.15,
      }}
      whileHover={prefersReducedMotion ? undefined : { y: -6 }}
      className="group"
    >
      <SepiaImageFrame
        src={`https://picsum.photos/seed/${imageSeed}/400/300`}
        alt={impact}
        aspectRatio="landscape"
        size="full"
        showCornerAccents={true}
      />
      <div className="mt-4">
        <span className="font-display text-lg font-bold text-rust">
          {amount}
        </span>
        <p className="font-body text-body-sm text-ink mt-1 leading-relaxed">
          {impact}
        </p>
        <span className="font-body text-caption text-sepia-mid tracking-[0.1em] mt-2 block">
          {caption}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */

export default function Donate() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const { data: impactStats } = useQuery({
    queryKey: ['donation-stats'],
    queryFn: async () => {
      try {
        return await donationsApi.getImpactStats();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const totalAmount = impactStats?.total_amount
    ? parseFloat(impactStats.total_amount)
    : 890000;
  const totalDonors = impactStats?.total_donors ?? 2847;

  const donateMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      frequency: 'once' | 'monthly';
      anonymous: boolean;
      message: string;
      paymentMethod?: 'wechat' | 'alipay' | 'stripe' | 'paypal';
    }) => {
      const { user } = useAuthStore.getState();
      return donationsApi.create({
        donor_name: data.anonymous ? 'Anonymous' : (user?.nickname || user?.email || 'Guest'),
        amount: data.amount,
        currency: 'CNY',
        payment_method: data.paymentMethod || 'wechat',
        is_anonymous: data.anonymous,
        message: data.message || undefined,
      });
    },
  });

  const donationStories = [
    {
      amount: t('donate.stories.items.0.amount'),
      impact: t('donate.stories.items.0.impact'),
      caption: t('donate.stories.items.0.caption'),
      imageSeed: 'donation-school-art',
    },
    {
      amount: t('donate.stories.items.1.amount'),
      impact: t('donate.stories.items.1.impact'),
      caption: t('donate.stories.items.1.caption'),
      imageSeed: 'donation-tote-bags',
    },
    {
      amount: t('donate.stories.items.2.amount'),
      impact: t('donate.stories.items.2.impact'),
      caption: t('donate.stories.items.2.caption'),
      imageSeed: 'donation-workshop-rural',
    },
  ];

  return (
    <PageWrapper>
      <EditorialHero
        title={t('donate.hero.title')}
        subtitle={t('donate.hero.subtitle')}
        fullHeight={true}
      />

      {/* Emotional Introduction */}
      <SectionContainer narrow>
        <StoryQuoteBlock
          quote={t('donate.emotional.quote')}
          author={t('donate.emotional.author')}
          role={t('donate.emotional.role')}
        />
      </SectionContainer>

      {/* Main donation area */}
      <SectionContainer noTopSpacing>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          {/* Left: Impact Breakdown */}
          <div className="md:col-span-5">
            <NumberedSectionHeading
              number="01"
              title={t('donate.impact.title')}
            />

            {/* Enhanced impact progress bars */}
            <div className="space-y-7 mt-8">
              {IMPACT_AREAS.map((area, index) => (
                <ImpactProgressBar
                  key={area.key}
                  label={t(`donate.impact.${area.key}`)}
                  description={t(`donate.impact.${area.key}Desc`)}
                  pct={area.pct}
                  icon={area.icon}
                  index={index}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </div>

            {/* Impact counters */}
            <div className="grid grid-cols-2 gap-6 mt-12">
              <ImpactCounter value={totalAmount} label={t('donate.counters.fundsRaised')} prefix="¥" />
              <ImpactCounter value={totalDonors} label={t('donate.counters.childrenHelped')} />
            </div>
          </div>

          {/* Right: Donation panel */}
          <div className="md:col-span-7">
            <DonationPanel
              onSubmit={donateMutation.mutate}
              isSubmitting={donateMutation.isPending}
            />
          </div>
        </div>
      </SectionContainer>

      {/* Donation Success Stories */}
      <SectionContainer>
        <NumberedSectionHeading
          number="02"
          title={t('donate.stories.title')}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {donationStories.map((story, i) => (
            <DonationStoryCard
              key={story.imageSeed}
              amount={story.amount}
              impact={story.impact}
              caption={story.caption}
              imageSeed={story.imageSeed}
              index={i}
            />
          ))}
        </div>
      </SectionContainer>

      {/* Transparency */}
      <section className="bg-aged-stock section-spacing relative">
        <SectionGrainOverlay />

        <SectionContainer>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
            <div className="md:col-span-5 relative">
              {/* Decorative corner accents */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-sage/30 pointer-events-none" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-sage/30 pointer-events-none" />

              <h3 className="font-display text-h3 font-bold text-ink mb-4">
                {t('donate.transparency.title')}
              </h3>
              <p className="font-body text-body-sm text-ink-faded leading-relaxed mb-6">
                {t('donate.transparency.subtitle')}
              </p>

              {/* Specific transparency data points */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-sage/60 rounded-sm mt-2 shrink-0" />
                  <span className="font-body text-body-sm text-ink">
                    {t('donate.transparency.lastAudit')}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-sage/60 rounded-sm mt-2 shrink-0" />
                  <span className="font-body text-body-sm text-ink">
                    {t('donate.transparency.onChain')}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-sage/60 rounded-sm mt-2 shrink-0" />
                  <span className="font-body text-body-sm text-ink">
                    {t('donate.transparency.quarterly')}
                  </span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mb-8">
                <span className="font-body text-caption text-sepia-mid tracking-[0.15em] uppercase block mb-3">
                  {t('donate.transparency.trustIndicators')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    t('donate.transparency.trust.audited'),
                    t('donate.transparency.trust.verified'),
                    t('donate.transparency.trust.transparent'),
                    t('donate.transparency.trust.impactReported'),
                  ].map((badge, i) => (
                    <TrustBadge key={badge} label={badge} index={i} prefersReducedMotion={prefersReducedMotion} />
                  ))}
                </div>
              </div>

              <motion.button
                className="font-body text-caption text-sage tracking-[0.15em] uppercase hover:text-ink transition-colors cursor-pointer"
                whileHover={prefersReducedMotion ? undefined : { x: 4 }}
              >
                {t('donate.transparency.viewReport')} &rarr;
              </motion.button>
            </div>
            <div className="md:col-span-7">
              <div className="grid grid-cols-2 gap-4">
                {['Q1 2026', 'Q4 2025', 'Q3 2025', 'Q2 2025'].map((quarter, index) => (
                  <motion.div
                    key={quarter}
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                    className="border border-warm-gray/30 p-6 bg-paper hover:border-sage/30 transition-colors cursor-pointer relative"
                  >
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-sage/30 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-sage/30 pointer-events-none" />

                    <span className="font-body text-caption text-sepia-mid tracking-[0.15em]">
                      {t('donate.transparency.financialReport')}
                    </span>
                    <h4 className="font-display text-lg font-bold text-ink mt-2">
                      {quarter}
                    </h4>
                    <span className="font-body text-caption text-sepia-mid mt-2 block">
                      {t('donate.transparency.pdfSize')}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* Quote */}
      <SectionContainer narrow>
        <StoryQuoteBlock
          quote={t('donate.transparency.transparencyQuote')}
          author={t('donate.transparency.transparencyQuoteAuthor')}
        />
      </SectionContainer>

      {/* FAQ Section */}
      <SectionContainer>
        <div className="max-w-3xl mx-auto">
          <NumberedSectionHeading
            number="03"
            title={t('donate.faq.title')}
          />
          <div className="mt-8">
            <FAQAccordion
              items={[
                {
                  question: t('donate.faq.q1'),
                  answer: t('donate.faq.a1'),
                },
                {
                  question: t('donate.faq.q2'),
                  answer: t('donate.faq.a2'),
                },
                {
                  question: t('donate.faq.q3'),
                  answer: t('donate.faq.a3'),
                },
                {
                  question: t('donate.faq.q4'),
                  answer: t('donate.faq.a4'),
                },
              ]}
            />
          </div>
        </div>
      </SectionContainer>

      {/* Final CTA */}
      <section className="bg-ink text-paper section-spacing relative overflow-hidden">
        <SectionGrainOverlay />

        <SectionContainer>
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            {/* Decorative line above */}
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { scaleX: 0 }, whileInView: { scaleX: 1 }, viewport: { once: true }, transition: { duration: 0.8, ease: [0, 0, 0.2, 1] } })}
              className="h-px w-20 bg-sage/50 mx-auto mb-10 origin-center"
            />

            <motion.h2
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { type: 'spring', stiffness: 300, damping: 30 } })}
              className="font-display text-h2 md:text-h1 font-bold leading-[0.95] mb-10"
            >
              {t('donate.cta.title')}
            </motion.h2>

            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { type: 'spring', stiffness: 300, damping: 30, delay: 0.15 } })}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <MagneticButton strength={0.35}>
                <a
                  href="#main-content"
                  className="inline-block font-body text-body-sm tracking-[0.15em] uppercase bg-rust text-paper px-10 py-4 hover:bg-pale-gold hover:text-ink transition-all duration-300 cursor-pointer"
                >
                  {t('donate.cta.donate')}
                </a>
              </MagneticButton>
              <MagneticButton strength={0.35}>
                <Link
                  to="/about"
                  className="inline-block font-body text-body-sm tracking-[0.15em] uppercase border border-sage/40 text-paper px-10 py-4 hover:border-sage hover:text-sage-pale transition-all duration-300 cursor-pointer"
                >
                  {t('donate.cta.learnMore')}
                </Link>
              </MagneticButton>
            </motion.div>

            {/* Decorative line below */}
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { scaleX: 0 }, whileInView: { scaleX: 1 }, viewport: { once: true }, transition: { duration: 0.8, ease: [0, 0, 0.2, 1], delay: 0.3 } })}
              className="h-px w-20 bg-sage/50 mx-auto mt-10 origin-center"
            />
          </div>
        </SectionContainer>
      </section>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
