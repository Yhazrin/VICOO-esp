import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import NumberedSectionHeading from '@/components/editorial/NumberedSectionHeading';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const SECTIONS = [
  { key: 'acceptance' },
  { key: 'services' },
  { key: 'accounts' },
  { key: 'donations' },
  { key: 'purchases' },
  { key: 'ip' },
  { key: 'liability' },
  { key: 'changes' },
  { key: 'governing' },
];

export default function Terms() {
  const { t } = useTranslation();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="section-spacing">
        <SectionContainer narrow>
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6 }}
          >
            <p className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid mb-4">
              {t('legal.terms.overline', { defaultValue: 'Legal' })}
            </p>
            <h1 className="font-display text-h1 font-bold text-ink leading-tight mb-4">
              {t('legal.terms.title', { defaultValue: 'Terms of Service' })}
            </h1>
            <p className="font-body text-xs text-sepia-mid tracking-wide mb-12">
              {t('legal.terms.lastUpdated', { defaultValue: 'Last updated: March 2026' })}
            </p>
          </motion.div>

          <div className="space-y-12">
            {SECTIONS.map((section, i) => (
              <motion.section
                key={section.key}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: i * 0.06 }}
              >
                <NumberedSectionHeading
                  number={String(i + 1).padStart(2, '0')}
                  title={t(`legal.terms.sections.${section.key}.title`, { defaultValue: section.key.charAt(0).toUpperCase() + section.key.slice(1) })}
                />
                <p className="font-body text-sm text-ink-faded leading-[1.8] max-w-[65ch]">
                  {t(`legal.terms.sections.${section.key}.body`, { defaultValue: 'This section is being prepared. Please check back later for the complete content.' })}
                </p>
              </motion.section>
            ))}
          </div>
        </SectionContainer>
      </PaperTextureBackground>

      <div className="editorial-divider" aria-hidden="true" />
    </PageWrapper>
  );
}
