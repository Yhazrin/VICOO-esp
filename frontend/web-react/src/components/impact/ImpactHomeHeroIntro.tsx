import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';

export const IMPACT_CARD_KEYS = ['everyday', 'trace', 'recycle', 'circularFashion'] as const;

export type ImpactTabKey = 'campaigns' | 'donate' | 'clothing-recycle' | 'shop';

let stopActiveImpactAutoScroll: (() => void) | null = null;

export function useGoToImpactTab() {
  const setActiveImpactTab = useUIStore((s) => s.setActiveImpactTab);
  const setImpactMode = useUIStore((s) => s.setImpactMode);

  return (tab: ImpactTabKey) => {
    setImpactMode(true);
    setActiveImpactTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}

export function scrollToImpactStory() {
  stopActiveImpactAutoScroll?.();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const maxScrollY = () => Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );

  const startY = window.scrollY;
  const endY = maxScrollY();
  const distance = endY - startY;

  if (distance < 4) return;

  if (reduceMotion) {
    window.scrollTo(0, endY);
    return;
  }

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  const duration = Math.min(18000, Math.max(9500, distance * 2.8));
  const startedAt = performance.now();
  let running = true;
  let rafId = 0;
  let lastProgrammaticY = startY;

  const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
  const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
  const smoothstep = (value: number) => value * value * (3 - 2 * value);
  const storyBeatLag = (progress: number) => {
    const beats = [0.14, 0.36, 0.58, 0.78];
    const strongestBeat = beats.reduce((best, beat) => {
      const distanceToBeat = (progress - beat) / 0.055;
      return Math.max(best, Math.exp(-(distanceToBeat * distanceToBeat)));
    }, 0);
    return strongestBeat * 0.012;
  };

  const stop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    root.style.scrollBehavior = previousScrollBehavior;
    stopActiveImpactAutoScroll = null;
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('pointerdown', stop);
    window.removeEventListener('keydown', stop);
  };

  root.style.scrollBehavior = 'auto';
  stopActiveImpactAutoScroll = stop;
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('pointerdown', stop, { passive: true });
  window.addEventListener('keydown', stop);

  const step = (now: number) => {
    if (!running) return;
    const elapsed = now - startedAt;
    const currentMaxY = maxScrollY();
    const progress = clamp01(elapsed / duration);
    if (progress >= 1) {
      window.scrollTo(0, currentMaxY);
      stop();
      return;
    }

    const entry = progress < 0.08 ? easeOutCubic(progress / 0.08) * 0.08 : progress;
    const exit = entry > 0.9 ? 0.9 + smoothstep((entry - 0.9) / 0.1) * 0.1 : entry;
    const envelope = Math.sin(progress * Math.PI);
    const breath = Math.sin(progress * Math.PI * 8 - Math.PI / 2) * 0.014 * envelope;
    const motionProgress = clamp01(exit + breath - storyBeatLag(progress));
    const nextY = Math.max(
      lastProgrammaticY,
      startY + (currentMaxY - startY) * motionProgress,
    );
    lastProgrammaticY = nextY;
    window.scrollTo(0, Math.min(currentMaxY, nextY));
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

type ImpactHomeHeroIntroProps = {
  isDark: boolean;
};

export default function ImpactHomeHeroIntro({ isDark }: ImpactHomeHeroIntroProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const goToTab = useGoToImpactTab();

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.65, delay: 0.15, ease: [0, 0, 0.2, 1] as const },
      };

  const titleClass = isDark ? 'text-[#FAF8F5]' : 'text-[#141412]';
  const eyebrowClass = isDark ? 'text-[#9BC4A4]' : 'text-[#4A6B52]';

  const primaryBtn = isDark
    ? 'bg-[#F5F2EE] text-[#1C1C1A] hover:bg-white'
    : 'bg-[#1C1C1A] text-[#FAF8F5] hover:bg-[#2a2a28]';

  const secondaryBtn = isDark
    ? 'border-white/25 text-[#F5F2EE] hover:border-white/40 bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150'
    : 'border-[#1C1C1A]/20 text-[#1C1C1A] hover:border-[#1C1C1A]/35 bg-white/30 backdrop-blur-xl backdrop-saturate-150';

  const titleShadow = isDark
    ? 'drop-shadow-[0_4px_28px_rgba(0,0,0,0.65)]'
    : 'drop-shadow-[0_2px_24px_rgba(250,248,245,0.9)]';

  return (
    <motion.div
      {...motionProps}
      className="pointer-events-auto w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-[48rem]"
    >
      <p
        className={`font-body text-xs sm:text-sm md:text-[0.9375rem] font-semibold tracking-[0.26em] uppercase mb-5 md:mb-6 ${eyebrowClass}`}
      >
        {t('home.impactHero.eyebrow', 'SDG 12 · Responsible Consumption and Production')}
      </p>

      <h1
        className={`font-display text-hero font-bold leading-[0.98] tracking-[-0.045em] text-balance ${titleClass} ${titleShadow}`}
      >
        {t('home.impactHero.title', 'Every Action Leaves a Trace.')}
      </h1>

      <p
        className={`font-body font-normal leading-[1.5] mt-5 md:mt-6 max-w-xl md:max-w-2xl text-h4 md:text-[clamp(1.0625rem,2.4vw,1.375rem)] ${
          isDark ? 'text-[#D0CCC8]' : 'text-[#3D3D3A]'
        }`}
      >
        {t(
          'home.impactHero.subtitleShort',
          'VICOO × UNIQLO — traceable journeys, recycled materials, and responsible consumption under SDG 12.',
        )}
      </p>

      <div className="mt-8 md:mt-10 flex flex-wrap gap-3 md:gap-4">
        <button
          type="button"
          onClick={scrollToImpactStory}
          className={`font-body text-sm font-semibold tracking-[0.1em] uppercase px-7 py-3.5 md:px-8 md:py-4 rounded-full transition-colors cursor-pointer ${primaryBtn}`}
        >
          {t('home.impactHero.cta.explore', 'Explore Impact')}
        </button>
        <button
          type="button"
          onClick={() => goToTab('shop')}
          className={`font-body text-sm font-semibold tracking-[0.1em] uppercase px-7 py-3.5 md:px-8 md:py-4 rounded-full border transition-colors cursor-pointer ${secondaryBtn}`}
        >
          {t('home.impactHero.cta.shop', 'Shop the Collaboration')}
        </button>
      </div>
    </motion.div>
  );
}

type ImpactHomePillarCardsProps = {
  isDark: boolean;
  className?: string;
};

export function ImpactHomePillarCards({ isDark, className = '' }: ImpactHomePillarCardsProps) {
  const { t } = useTranslation();
  const goToTab = useGoToImpactTab();

  const glassCard = isDark
    ? 'border-white/12 bg-white/[0.07] backdrop-blur-xl backdrop-saturate-150 hover:border-white/20 hover:bg-white/[0.1] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)]'
    : 'border-white/55 bg-white/30 backdrop-blur-xl backdrop-saturate-150 hover:border-white/70 hover:bg-white/40 shadow-[0_12px_40px_-16px_rgba(28,28,28,0.12)]';

  const titleClass = isDark ? 'text-[#F5F2EE]' : 'text-[#1C1C1A]';
  const bodyClass = isDark ? 'text-[#A8A4AA]' : 'text-[#5C5C58]';

  const tabByCard: Record<(typeof IMPACT_CARD_KEYS)[number], ImpactTabKey> = {
    everyday: 'shop',
    trace: 'shop',
    recycle: 'clothing-recycle',
    circularFashion: 'shop',
  };

  return (
    <div className={`w-full pointer-events-auto ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6 md:gap-8 lg:gap-10 w-full max-w-[100%]">
        {IMPACT_CARD_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => goToTab(tabByCard[key])}
            className={`w-full min-h-[6rem] md:min-h-[6.5rem] text-left rounded-xl border px-5 py-5 md:px-7 md:py-6 transition-colors cursor-pointer ${glassCard}`}
          >
            <p className={`font-display text-body-sm md:text-base font-semibold leading-snug ${titleClass}`}>
              {t(`home.impactHero.cards.${key}.title`, key)}
            </p>
            <p className={`font-body text-[12px] md:text-[13px] leading-relaxed mt-2.5 ${bodyClass}`}>
              {t(`home.impactHero.cards.${key}.body`, '')}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
