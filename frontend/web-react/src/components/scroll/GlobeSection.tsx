import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { SUPPLY_CHAIN_ROUTES } from '@/data/supplyChain';
import SupplyChainGlobe from './SupplyChainGlobe';

export default function GlobeSection() {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const isEnglish = i18n.resolvedLanguage?.startsWith('en');

  const routes = useMemo(() => SUPPLY_CHAIN_ROUTES, []);

  const staggerDelay = (index: number) => (prefersReducedMotion ? 0 : 0.15 + index * 0.1);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-aged-stock">
      {/* Globe canvas */}
      <SupplyChainGlobe routes={routes} />

      {/* Reduced-motion fallback: static route visualization */}
      {prefersReducedMotion && (
        <div className="absolute inset-0 flex items-center justify-center z-[5]">
          <div className="flex gap-6 px-8">
            {routes.map((route) => (
              <div
                key={route.productId}
                className="flex flex-col items-center gap-2 p-4 border border-rust/20 bg-paper/60"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                <span className="font-body text-caption text-ink">
                  {isEnglish ? route.productNameEn : route.productNameZh}
                </span>
                <span className="font-body text-[10px] text-sepia-mid">
                  {route.nodes.map((n) => (isEnglish ? n.labelEn : n.labelZh)).join(' → ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        {/* Top-left headline */}
        <div className="px-8 md:px-16 pt-24 md:pt-32 max-w-2xl">
          <motion.div
            {...(prefersReducedMotion ? {} : {
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.8, delay: 0.3, ease: [0, 0, 0.2, 1] },
            })}
          >
            <span className="font-body text-caption text-sepia-mid tracking-[0.3em] uppercase block mb-4">
              {t('home.globe.label', 'Model A — Traceability')}
            </span>
            <h2 className="font-display text-h2 md:text-h1 font-bold text-ink leading-[1.05] tracking-[-0.03em]">
              {t('home.globe.title', 'Every Thread, Traced')}
            </h2>
          </motion.div>

          <motion.p
            {...(prefersReducedMotion ? {} : {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.7, delay: 0.5, ease: [0, 0, 0.2, 1] },
            })}
            className="font-body text-body-sm text-ink-faded leading-relaxed mt-4 max-w-md"
          >
            {t(
              'home.globe.subtitle',
              'From organic cotton fields to finished garments — every step verified, transparent, sustainable.',
            )}
          </motion.p>
        </div>

        {/* Bottom: route cards + scroll hint */}
        <div className="px-8 md:px-16 pb-10 md:pb-16">
          {/* Route cards */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 pointer-events-auto">
            {routes.map((route, i) => (
              <motion.div
                key={route.productId}
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.5, delay: staggerDelay(i), ease: [0, 0, 0.2, 1] },
                })}
              >
                <Link
                  to="/traceability"
                  className="flex items-center gap-3 px-4 py-3 border border-rust/20 bg-paper/80 backdrop-blur-sm hover:border-rust/40 transition-colors group"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: route.color }}
                  />
                  <div className="min-w-0">
                    <p className="font-body text-caption text-ink truncate">
                      {isEnglish ? route.productNameEn : route.productNameZh}
                    </p>
                    <p className="font-body text-[10px] text-sepia-mid truncate">
                      {route.nodes.map((n) => (isEnglish ? n.labelEn : n.labelZh)).join(' → ')}
                    </p>
                  </div>
                  <span className="font-body text-[10px] text-sage flex-shrink-0 ml-2">
                    {t('home.globe.co2Saved', '{{value}} kg CO₂ saved', { value: route.co2 })}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Scroll hint */}
          <motion.div
            {...(prefersReducedMotion ? {} : {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { duration: 0.6, delay: 1.2 },
            })}
            className="flex flex-col items-center gap-1"
          >
            <span className="font-body text-[10px] text-sepia-mid tracking-[0.25em] uppercase">
              {t('home.globe.scrollHint', 'Scroll to explore')}
            </span>
            <div className="w-px h-5 bg-gradient-to-b from-sepia-mid/40 to-transparent" />
          </motion.div>
        </div>
      </div>

      <SectionGrainOverlay opacity={0.02} />
    </section>
  );
}
