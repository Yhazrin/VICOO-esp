import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';

const PILLAR_KEYS = ['p1', 'p2', 'p3', 'p4'] as const;

function PillarIcon({ index }: { index: number }) {
  const paths = [
    'M12 3v18M3 12h18M6 6l12 12M18 6L6 18',
    'M4 7h16M4 12h10M4 17h16',
    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  ];
  return (
    <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[index]} />
    </svg>
  );
}

export default function WelfareTraceabilitySustainabilityPanel() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      className="relative border-2 border-rust/25 bg-paper overflow-hidden"
      aria-labelledby="welfare-trace-sustain-heading"
    >
      <SectionGrainOverlay className="z-10" />
      <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-rust/25 pointer-events-none z-20" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-rust/25 pointer-events-none z-20" />

      <div className="relative z-30 p-8 md:p-10 lg:p-12">
        <p className="font-body text-overline tracking-[0.28em] uppercase text-sepia-mid mb-4">
          {t('campaigns.sustainabilityLoop.eyebrow')}
        </p>
        <h2 id="welfare-trace-sustain-heading" className="font-display text-h3 font-bold text-ink mb-4 max-w-3xl">
          {t('campaigns.sustainabilityLoop.title')}
        </h2>
        <p className="font-body text-body-sm text-ink-faded leading-[1.85] max-w-3xl mb-10">
          {t('campaigns.sustainabilityLoop.subtitle')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
          {PILLAR_KEYS.map((key, index) => (
            <motion.div
              key={key}
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 16 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: '-40px' },
                    transition: { duration: 0.45, delay: index * 0.08 },
                  })}
              className="border border-warm-gray/35 bg-aged-stock/80 p-5 md:p-6 flex flex-col gap-3"
            >
              <div className="w-10 h-10 border border-sage/35 rounded-sm flex items-center justify-center bg-sage/5">
                <PillarIcon index={index} />
              </div>
              <h3 className="font-display text-body-sm font-bold text-ink">
                {t(`campaigns.sustainabilityLoop.${key}Title`)}
              </h3>
              <p className="font-body text-caption text-ink-faded leading-relaxed tracking-wide">
                {t(`campaigns.sustainabilityLoop.${key}Body`)}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="font-body text-overline text-sepia-mid/90 mt-10 max-w-3xl leading-relaxed tracking-wide">
          {t('campaigns.sustainabilityLoop.footnote')}
        </p>

        <div className="flex flex-wrap gap-4 mt-8">
          <Link
            to="/shop"
            className="inline-flex font-body text-label tracking-[0.18em] uppercase px-6 py-3 border-2 border-rust text-rust hover:bg-rust hover:text-paper transition-colors duration-300"
          >
            {t('campaigns.sustainabilityLoop.ctaTraceability')}
          </Link>
          <Link
            to="/impact/shop"
            className="inline-flex font-body text-label tracking-[0.18em] uppercase px-6 py-3 border border-warm-gray/50 text-ink hover:border-ink transition-colors duration-300"
          >
            {t('campaigns.sustainabilityLoop.ctaShop')}
          </Link>
        </div>
      </div>
    </section>
  );
}
