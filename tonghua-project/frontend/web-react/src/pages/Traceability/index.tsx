import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import EditorialHero from '@/components/editorial/EditorialHero';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import SepiaImageFrame from '@/components/editorial/SepiaImageFrame';
import StoryQuoteBlock from '@/components/editorial/StoryQuoteBlock';
import TraceabilityTimeline from '@/components/editorial/TraceabilityTimeline';
import type { SupplyChainRecord } from '@/types';

const MOCK_RECORDS: SupplyChainRecord[] = [
  {
    id: '1',
    stage: 'artwork',
    description: 'Xiao Lin, age 8, created her ocean painting during a Saturday workshop at Dongfeng Elementary School. The artwork was selected by peer vote.',
    location: 'Shanghai, China',
    date: '2025-11-15',
    verified: true,
    partnerName: 'Dongfeng Elementary School',
    carbonFootprint: 0,
  },
  {
    id: '2',
    stage: 'design',
    description: 'Our design team adapted the artwork for textile printing, maintaining the child\'s original brushstrokes and color palette. Xiao Lin approved the final design.',
    location: 'Shanghai, China',
    date: '2025-12-01',
    verified: true,
    partnerName: 'Tonghua Design Studio',
    carbonFootprint: 0.2,
  },
  {
    id: '3',
    stage: 'material',
    description: 'GOTS-certified organic cotton sourced from Xinjiang cooperative. Fair trade pricing verified by third-party auditor.',
    location: 'Xinjiang, China',
    date: '2025-12-20',
    verified: true,
    partnerName: 'GreenCotton Cooperative',
    carbonFootprint: 1.8,
  },
  {
    id: '4',
    stage: 'production',
    description: 'Screen-printed and sewn at SA8000-certified factory. Living wages paid. Working conditions audited quarterly.',
    location: 'Guangzhou, China',
    date: '2026-01-10',
    verified: true,
    partnerName: 'FairWear Manufacturing',
    carbonFootprint: 2.4,
  },
  {
    id: '5',
    stage: 'quality',
    description: 'Quality inspection passed. Color fastness, seam strength, and sizing verified against specifications.',
    location: 'Guangzhou, China',
    date: '2026-01-25',
    verified: true,
    partnerName: 'FairWear Manufacturing',
    carbonFootprint: 0.1,
  },
  {
    id: '6',
    stage: 'shipping',
    description: 'Shipped via consolidated freight to reduce emissions. Carbon offset purchased through certified program.',
    location: 'Guangzhou → Shanghai',
    date: '2026-02-05',
    verified: true,
    partnerName: 'GreenLogistics Co.',
    carbonFootprint: 0.8,
  },
];

export default function Traceability() {
  const { t } = useTranslation();

  return (
    <PageWrapper>
      <EditorialHero
        number="07"
        title={t('traceability.hero.title')}
        subtitle={t('traceability.hero.subtitle')}
        hideHero={true}
      />

      {/* Featured traceability example */}
      <SectionContainer noTopSpacing>
        <NumberedSectionHeading
          number="01"
          title="Dreamscape Tee — Full Journey"
          subtitle="Follow the complete lifecycle of one product, from a child's brushstroke to your wardrobe."
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Image */}
          <div className="md:col-span-5 md:order-2">
            <div className="sticky top-28">
              <SepiaImageFrame
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80"
                alt="Dreamscape Tee"
                aspectRatio="portrait"
                size="full"
              />

              {/* Carbon total */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-6 border border-warm-gray/30 p-6 bg-aged-stock"
              >
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em] uppercase">
                  {t('traceability.carbon')} — Total
                </span>
                <div className="font-display text-h3 font-bold text-ink mt-2">
                  5.3 kg CO₂
                </div>
                <p className="font-body text-xs text-ink-faded mt-2 leading-relaxed">
                  Offset through verified reforestation project in Yunnan Province.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Timeline */}
          <div className="md:col-span-7 md:order-1">
            <TraceabilityTimeline records={MOCK_RECORDS} />
          </div>
        </div>
      </SectionContainer>

      {/* Quote */}
      <SectionContainer narrow>
        <StoryQuoteBlock
          quote="If you can trace it, you can trust it. Every stitch tells a story worth knowing."
          author="Supply Chain Manifesto"
          role="Tonghua Public Welfare, 2025"
        />
      </SectionContainer>

      {/* How it works */}
      <section className="bg-aged-stock section-spacing">
        <SectionContainer>
          <NumberedSectionHeading
            number="02"
            title="How Traceability Works"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Record',
                desc: 'Every step in the supply chain is documented with photos, dates, locations, and partner verification.',
              },
              {
                num: '02',
                title: 'Verify',
                desc: 'Third-party auditors verify each record. Unverified steps are flagged transparently.',
              },
              {
                num: '03',
                title: 'Publish',
                desc: 'The complete journey is published on our platform for every customer to inspect.',
              },
            ].map((step) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
                className="border-t border-warm-gray/30 pt-6"
              >
                <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">
                  {step.num}
                </span>
                <h3 className="font-display text-h3 font-bold text-ink mt-2 mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-ink-faded leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </SectionContainer>
      </section>

      <div className="editorial-divider" />
    </PageWrapper>
  );
}
