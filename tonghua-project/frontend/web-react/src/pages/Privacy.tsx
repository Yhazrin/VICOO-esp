import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import GrainOverlay from '@/components/editorial/GrainOverlay';
import { MagazineDivider } from '@/components/editorial/MagazineDivider';

const SECTIONS = [
  { key: 'overview' },
  { key: 'collection' },
  { key: 'usage' },
  { key: 'sharing' },
  { key: 'children' },
  { key: 'cookies' },
  { key: 'security' },
  { key: 'rights' },
  { key: 'contact' },
];

export default function Privacy() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="section-spacing relative">
        <GrainOverlay />

        {/* Decorative vertical line */}
        <div className="absolute left-6 top-1/4 bottom-1/4 w-px bg-rust/15 hidden md:block" aria-hidden="true" />

        <SectionContainer narrow>
          <motion.div
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } })}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Corner accents */}
            <div className="absolute -top-4 -left-4 w-6 h-6 border-t-2 border-l-2 border-rust/25 pointer-events-none" aria-hidden="true" />
            <div className="absolute -top-4 -right-4 w-6 h-6 border-t-2 border-r-2 border-rust/25 pointer-events-none" aria-hidden="true" />

            <p className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid mb-4">
              {t('legal.privacy.overline', { defaultValue: 'Legal' })}
            </p>
            <h1 className="font-display text-h1 font-bold text-ink leading-tight mb-4">
              {t('legal.privacy.title', { defaultValue: 'Privacy Policy' })}
            </h1>
            <p className="font-body text-sm text-ink-faded leading-[1.8] max-w-[65ch] mb-4">
              {t('legal.privacy.intro', { defaultValue: 'Your privacy matters to us. This policy explains how VICOO collects, uses, and protects your personal information when you visit our website, make donations, or participate in our programs.' })}
            </p>
            <p className="font-body text-xs text-sepia-mid tracking-wide mb-12">
              {t('legal.privacy.lastUpdated', { defaultValue: 'Last updated: March 2026' })}
            </p>
          </motion.div>

          <div className="space-y-12">
            {SECTIONS.map((section, i) => (
              <div key={section.key}>
                <motion.section
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 } })}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                >
                  <NumberedSectionHeading
                    number={String(i + 1).padStart(2, '0')}
                    title={t(`legal.privacy.sections.${section.key}.title`, { defaultValue: section.key.charAt(0).toUpperCase() + section.key.slice(1) })}
                  />
                  <p className="font-body text-sm text-ink-faded leading-[1.8] max-w-[65ch]">
                    {t(`legal.privacy.sections.${section.key}.body`, { defaultValue: 'This section is being prepared. Please check back later for the complete content.' })}
                  </p>
                </motion.section>
                {i < SECTIONS.length - 1 && (
                  <MagazineDivider variant="simple" className="!my-10" />
                )}
              </div>
            ))}
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      <div className="editorial-divider" aria-hidden="true" />
    </PageWrapper>
  );
}
