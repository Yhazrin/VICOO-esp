import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import PageWrapper from '@/components/layout/PageWrapper';
import SectionContainer from '@/components/layout/SectionContainer';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import GrainOverlay from '@/components/editorial/GrainOverlay';

export default function NotFound() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="min-h-[80dvh] flex items-center relative">
        <GrainOverlay />

        <SectionContainer>
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7, ease: [0, 0, 0.2, 1] }}
            className="text-center max-w-xl mx-auto relative"
          >
            {/* Corner accents */}
            <div className="absolute -top-6 -left-6 w-8 h-8 border-t-2 border-l-2 border-rust/30 pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-6 -right-6 w-8 h-8 border-b-2 border-r-2 border-rust/30 pointer-events-none" aria-hidden="true" />

            {/* Error number — editorial style */}
            <span className="font-body text-overline tracking-[0.3em] uppercase text-sepia-mid block mb-6">
              {t('notFound.label', 'Error')}
            </span>

            <h1 className="font-display text-hero font-black text-ink leading-none mb-6">
              404
            </h1>

            {/* Decorative divider */}
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { scaleX: 0 }, animate: { scaleX: 1 }, transition: { duration: 0.8, delay: 0.3, ease: [0, 0, 0.2, 1] } })}
              className="h-px w-[80px] bg-rust/50 mx-auto mb-8 origin-center"
            />

            <p className="font-body text-body-sm text-ink-faded leading-relaxed mb-10">
              {t('notFound.subtitle')}
            </p>

            <Link
              to="/"
              className="inline-block font-body text-caption text-rust tracking-[0.15em] uppercase hover:text-ink transition-colors cursor-pointer border border-rust/30 px-8 py-3 hover:bg-rust hover:text-paper transition-all duration-300"
            >
              {t('notFound.cta')}
            </Link>
          </motion.div>
        </SectionContainer>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
