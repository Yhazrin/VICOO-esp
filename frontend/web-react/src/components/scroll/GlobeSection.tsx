import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { SUPPLY_CHAIN_ROUTES } from '@/data/supplyChain';
import { useUIStore, DARK_THEMES } from '@/stores/uiStore';

const SupplyChainGlobe = lazy(() => import('./SupplyChainGlobe'));

function scheduleIdle(cb: () => void, timeout: number) {
  if (typeof requestIdleCallback !== 'undefined') {
    return requestIdleCallback(cb, { timeout });
  }
  return window.setTimeout(cb, 48) as unknown as number;
}

function cancelIdle(id: number) {
  if (typeof cancelIdleCallback !== 'undefined') {
    cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

export default function GlobeSection() {
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const impactMode = useUIStore((s) => s.impactMode);
  const currentTheme = useUIStore((s) => s.currentTheme);
  const isDark = impactMode && DARK_THEMES.has(currentTheme);
  const isEnglish = i18n.resolvedLanguage?.startsWith('en');
  /** 公益首页与文字先 paint，再 idle 时拉 chunk + 起 WebGL，避免首帧与 Planar3D 抢主线程 */
  /** 公益壳下大球由 Layout 的 ImpactWelfareGlobeLayer 常驻，此处不挂第二套 WebGL */
  const [mountGlobe, setMountGlobe] = useState(!impactMode);

  const routes = useMemo(() => SUPPLY_CHAIN_ROUTES, []);

  useEffect(() => {
    if (impactMode) {
      setMountGlobe(false);
      return;
    }
    const id = scheduleIdle(() => setMountGlobe(true), 420);
    return () => cancelIdle(id);
  }, [impactMode]);

  const staggerDelay = (index: number) => (prefersReducedMotion ? 0 : 0.15 + index * 0.1);

  return (
    <section
      className={`relative z-0 w-full min-h-[100dvh] overflow-visible ${
        impactMode
          ? isDark
            ? '-mt-[4.25rem] md:-mt-24'
            : '-mt-[4.25rem] md:-mt-24 welfare-border-white/20 welfare-bg-white/22 welfare-shadow-inner-white/45'
          : 'bg-aged-stock'
      }`}
    >
      {/* Globe: fixed position to stay in background while content scrolls */}
      <div className="pointer-events-auto fixed left-0 right-0 top-0 z-0 h-screen">
        {mountGlobe && !prefersReducedMotion && !impactMode && (
          <Suspense fallback={null}>
            <SupplyChainGlobe routes={routes} />
          </Suspense>
        )}
      </div>

      {/* Reduced-motion fallback: static route visualization */}
      {prefersReducedMotion && (
        <div className="absolute inset-0 z-[5] flex min-h-[100dvh] items-center justify-center">
          <div className="flex gap-6 px-8">
            {routes.map((route) => (
              <div
                key={route.productId}
                className={`flex flex-col items-center gap-2 p-4 border ${
                  impactMode
                    ? isDark
                      ? 'border-[rgba(255,255,255,0.08)] bg-[rgba(18,18,24,0.6)] backdrop-blur-md'
                      : 'welfare-border-white/35 welfare-bg-white\/45 welfare-backdrop-blur-md'
                    : 'border-rust/20 bg-paper/60'
                }`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                <span className={`font-body text-caption ${isDark ? 'text-[#F0ECE8]' : 'text-ink'}`}>
                  {isEnglish ? route.productNameEn : route.productNameZh}
                </span>
                <span className={`font-body text-[10px] ${isDark ? 'text-[#6A666C]' : 'text-sepia-mid'}`}>
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
        <div
          className={`px-8 md:px-16 max-w-2xl ${
            impactMode ? 'pt-[5.5rem] md:pt-[8rem]' : 'pt-24 md:pt-32'
          }`}
        >
          <motion.div
            {...(prefersReducedMotion ? {} : {
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.8, delay: 0.3, ease: [0, 0, 0.2, 1] },
            })}
          >
            <span className={`font-body text-caption tracking-[0.3em] uppercase block mb-4 ${isDark ? 'text-[#9A969C]' : 'text-sepia-mid'}`}>
              {t('home.globe.label', 'Model A — Traceability')}
            </span>
            <h2 className={`font-display text-h2 md:text-h1 font-bold leading-[1.05] tracking-[-0.03em] ${isDark ? 'text-[#F0ECE8]' : 'text-ink'}`}>
              {t('home.globe.title', 'Every Thread, Traced')}
            </h2>
          </motion.div>

          <motion.p
            {...(prefersReducedMotion ? {} : {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.7, delay: 0.5, ease: [0, 0, 0.2, 1] },
            })}
            className={`font-body text-body-sm leading-relaxed mt-4 max-w-md ${isDark ? 'text-[#9A969C]' : 'text-ink-faded'}`}
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
                  className={`flex items-center gap-3 px-4 py-3 border backdrop-blur-md transition-colors group ${
                    impactMode
                      ? isDark
                        ? 'border-[rgba(255,255,255,0.08)] bg-[rgba(18,18,24,0.7)] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(18,18,24,0.8)]'
                        : 'border-white/40 bg-white/50 hover:border-white/55 hover:bg-white/60'
                      : 'border-rust/20 bg-paper/80 backdrop-blur-sm hover:border-rust/40'
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: route.color }}
                  />
                  <div className="min-w-0">
                    <p className={`font-body text-caption truncate ${isDark ? 'text-[#F0ECE8]' : 'text-ink'}`}>
                      {isEnglish ? route.productNameEn : route.productNameZh}
                    </p>
                    <p className={`font-body text-[10px] truncate ${isDark ? 'text-[#6A666C]' : 'text-sepia-mid'}`}>
                      {route.nodes.map((n) => (isEnglish ? n.labelEn : n.labelZh)).join(' → ')}
                    </p>
                  </div>
                  <span className={`font-body text-[10px] flex-shrink-0 ml-2 ${isDark ? 'text-[#E6397C]' : 'text-sage'}`}>
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
            <span className={`font-body text-[10px] tracking-[0.25em] uppercase ${isDark ? 'text-[#6A666C]' : 'text-sepia-mid'}`}>
              {t('home.globe.scrollHint', 'Scroll to explore')}
            </span>
            <div className={`w-px h-5 bg-gradient-to-b to-transparent ${isDark ? 'from-[#6A666C]/40' : 'from-sepia-mid/40'}`} />
          </motion.div>
        </div>
      </div>

      <SectionGrainOverlay className="!z-[1]" opacity={isDark ? 0.003 : impactMode ? 0.008 : 0.02} />
    </section>
  );
}
