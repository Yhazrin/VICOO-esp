import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { SUPPLY_CHAIN_ROUTES } from '@/data/supplyChain';
import { useUIStore } from '@/stores/uiStore';
import { useGoToImpactTab, scrollToImpactStory } from '@/components/impact/ImpactHomeHeroIntro';

interface SceneProps {
  p: number;
  rm: boolean;
  mapRange: (v: number, i0: number, i1: number, o0: number, o1: number) => number;
}

/** i18n `t` for narrative scenes */
type NarrativeTProps = { t: TFunction };

/**
 * ScrollNarrative — Apple-style scroll-driven animation
 *
 * 500vh container + sticky 100vh viewport.
 * scrollProgress (0→1) drives 4 scene transitions.
 */
export default function ScrollNarrative() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { t } = useTranslation();
  const impactMode = useUIStore((s) => s.impactMode);

  // Scroll tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const ch = container.offsetHeight;
      const scrolled = -rect.top;
      const total = ch - vh;
      setScrollProgress(Math.max(0, Math.min(1, scrolled / total)));
    };

    handleScroll();
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { handleScroll(); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const clamp = useCallback((v: number, min: number, max: number) => Math.max(min, Math.min(max, v)), []);
  const lerp = useCallback((a: number, b: number, t: number) => a + (b - a) * t, []);
  const mapRange = useCallback((v: number, i0: number, i1: number, o0: number, o1: number) => {
    const t = clamp((v - i0) / (i1 - i0), 0, 1);
    return lerp(o0, o1, t);
  }, [clamp, lerp]);

  const p = scrollProgress;
  const rm = prefersReducedMotion;

  return (
    <div
      id="impact-scroll-story"
      ref={containerRef}
      className="relative z-10 -mt-[min(22dvh,12rem)] w-full"
      style={{ height: '480vh' }}
    >
      <div
        className="sticky overflow-hidden"
        style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', zIndex: 10 }}
      >
        {/* Background: keep the top edge clean so the opening globe cards are not tinted. */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-aged-stock/20 to-aged-stock" />

        {/* Scene 01 — Brand Manifesto */}
        <Scene01 p={p} rm={rm} mapRange={mapRange} t={t} impactMode={impactMode} />

        {/* Scene 02 — Orbital evidence flow */}
        <Scene02 p={p} rm={rm} mapRange={mapRange} t={t} />

        {/* Scene 03 — Impact Numbers */}
        <Scene03 p={p} rm={rm} mapRange={mapRange} t={t} />

        {/* Scene 04 — Call to Action */}
        <Scene04 p={p} rm={rm} mapRange={mapRange} t={t} impactMode={impactMode} />

        <SectionGrainOverlay opacity={0.03} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Scene 01 — Brand Manifesto (0 → 28%)
   ═══════════════════════════════════════════════════════════════ */

function Scene01({
  p,
  rm,
  mapRange,
  t,
  impactMode,
}: SceneProps & NarrativeTProps & { impactMode: boolean }) {
  // Layer opacity: visible 0–30%, fades out by 38%
  const opacity = rm ? 1 : (1 - mapRange(p, 0.25, 0.38, 0, 1));
  const y = rm ? 0 : mapRange(p, 0, 0.28, 0, -60);

  // Letter reveal
  const line1 = rm ? 0 : mapRange(p, 0, 0.12, 100, 0);
  const line2 = rm ? 0 : mapRange(p, 0.03, 0.15, 100, 0);
  const line3 = rm ? 0 : mapRange(p, 0.06, 0.18, 100, 0);

  // Right column
  const rightOp = rm ? 1 : mapRange(p, 0.08, 0.18, 0, 1);
  const rightY = rm ? 0 : mapRange(p, 0.08, 0.18, 30, 0);

  // Accent line
  const lineScale = rm ? 1 : mapRange(p, 0, 0.12, 0, 1);

  // Scroll indicator
  const scrollHint = rm ? 1
    : mapRange(p, 0.04, 0.1, 0, 1) * (1 - mapRange(p, 0.18, 0.26, 0, 1));

  return (
    <div
      className="absolute inset-0 flex items-center"
      style={{ opacity, transform: `translateY(${y}px)`, zIndex: 1 }}
    >
      {/* Scene number */}
      <div className="absolute top-16 left-8 md:left-16 z-10">
        <span className="font-body text-caption text-sepia-mid tracking-[0.3em]">01</span>
      </div>

      {/* Two-column layout */}
      <div className="w-full max-w-6xl mx-auto px-8 md:px-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
        {/* Left — Title */}
        <div className="md:col-span-7">
          <div
            className="w-12 h-px bg-rust mb-8 origin-left"
            style={{ transform: `scaleX(${lineScale})` }}
          />
          <h1 className="font-display text-h1 md:text-[clamp(40px,6vw,72px)] font-bold text-ink leading-[1.05] tracking-[-0.03em]">
            <div className="overflow-hidden">
              <span className="inline-block" style={{ transform: `translateY(${line1}%)` }}>
                {impactMode
                  ? t('home.impactNarrative.scene01.line1', 'Every Action')
                  : t('home.narrative.scene01.line1', 'Every Thread,')}
              </span>
            </div>
            <div className="overflow-hidden mt-1">
              <span className="inline-block" style={{ transform: `translateY(${line2}%)` }}>
                {impactMode
                  ? t('home.impactNarrative.scene01.line2', 'Leaves a')
                  : `${t('home.narrative.scene01.line2', 'Traced from')} `}
              </span>
            </div>
            <div className="overflow-hidden mt-1">
              <span className="inline-block text-rust" style={{ transform: `translateY(${line3}%)` }}>
                {impactMode
                  ? t('home.impactNarrative.scene01.line3', 'Trace.')
                  : t('home.narrative.scene01.line3', 'Source to Stitch')}
              </span>
            </div>
          </h1>
        </div>

        {/* Right — Description */}
        <div
          className="md:col-span-4 md:col-start-9"
          style={{ opacity: rightOp, transform: `translateY(${rightY}px)` }}
        >
          <div className="border-l-2 border-rust/30 pl-6">
            <p className="font-body text-body-sm text-ink-faded leading-[1.8]">
              {impactMode
                ? t(
                    'home.impactNarrative.scene01.subtitle',
                    'VICOO × UNIQLO — recycled materials, traceable journeys, circular choices under SDG 12.',
                  )
                : t('home.narrative.scene01.subtitle', 'From organic cotton fields to finished garments — verified at every step.')}
            </p>
            <p className="font-body text-caption text-sepia-mid tracking-[0.1em] uppercase mt-6">
              {impactMode
                ? t('home.impactHero.eyebrow', 'SDG 12 · Responsible Consumption and Production')
                : t('home.globe.label', 'Model A — Traceability')}
            </p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ opacity: scrollHint }}
        aria-hidden="true"
      >
        <span className="font-body text-[10px] text-sepia-mid tracking-[0.25em] uppercase">{t('home.narrative.scene01.scrollCue')}</span>
        <div className="w-px h-6 bg-gradient-to-b from-sepia-mid/40 to-transparent" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Scene 02 — Orbital Evidence Flow (18% → 52%)
   ═══════════════════════════════════════════════════════════════ */

function Scene02({ p, rm, mapRange, t }: SceneProps & NarrativeTProps) {
  // Layer: visible 18–52%
  const opacity = rm ? 1
    : mapRange(p, 0.18, 0.24, 0, 1) * (1 - mapRange(p, 0.46, 0.52, 0, 1));

  const layerY = rm ? 0 : mapRange(p, 0.18, 0.30, 42, -10);
  const orbitT = rm ? 1 : mapRange(p, 0.22, 0.42, 0, 1);
  const orbitRotate = rm ? -8 : mapRange(p, 0.20, 0.48, -18, 18);
  const apertureScale = rm ? 1 : mapRange(p, 0.18, 0.36, 0.86, 1.08);
  const apertureOpacity = rm ? 0.72 : mapRange(p, 0.18, 0.28, 0.28, 0.78);

  const evidence = SUPPLY_CHAIN_ROUTES.slice(0, 3).flatMap((route, routeIndex) =>
    route.nodes.slice(0, 2).map((node, nodeIndex) => ({
      id: `${route.productId}-${node.id}`,
      color: route.color,
      label: node.labelEn,
      angle: -112 + routeIndex * 78 + nodeIndex * 31,
      radius: 34 + routeIndex * 5 + nodeIndex * 4,
      delay: routeIndex * 0.025 + nodeIndex * 0.018,
    })),
  ).slice(0, 6);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity, transform: `translateY(${layerY}px)`, zIndex: 2 }}
    >
      {/* Scene number */}
      <div className="absolute top-16 left-8 md:left-16 z-20">
        <span className="font-body text-caption text-sepia-mid tracking-[0.3em]">02</span>
      </div>

      {/* Editorial quote overlay */}
      <div
        className="absolute top-12 right-8 md:right-16 z-20 max-w-xs text-right"
        style={{
          opacity: rm ? 1 : mapRange(p, 0.24, 0.32, 0, 1) * (1 - mapRange(p, 0.44, 0.50, 0, 1)),
        }}
      >
        <p className="font-display text-body-sm md:text-h4 italic text-ink/70 leading-snug">
          {t('home.narrative.scene02.quote')}
        </p>
      </div>

      {/* Globe aperture: lets the first-screen planet keep narrating under this scene. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="absolute left-1/2 top-1/2 h-[min(76vw,700px)] w-[min(88vw,920px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            opacity: rm ? 0.4 : mapRange(p, 0.22, 0.34, 0, 0.62) * (1 - mapRange(p, 0.44, 0.52, 0, 1)),
            background:
              'radial-gradient(circle at 50% 50%, rgba(245,238,224,0.88) 0%, rgba(241,231,206,0.52) 36%, rgba(241,231,206,0.18) 58%, rgba(241,231,206,0) 76%)',
          }}
        />
        <div
          className="relative h-[min(78vw,620px)] w-[min(78vw,620px)] rounded-full"
          style={{
            opacity: apertureOpacity,
            transform: `scale(${apertureScale})`,
            background:
              'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.16) 35%, rgba(239,231,214,0.72) 72%, rgba(239,231,214,0) 73%)',
            boxShadow: 'inset 0 0 90px rgba(255,255,255,0.2), 0 0 120px rgba(139,58,42,0.08)',
          }}
        >
          <div className="absolute inset-[7%] rounded-full border border-rust/16" />
          <div className="absolute inset-[17%] rounded-full border border-sage/18" />
          <div
            className="absolute inset-[27%] rounded-full border border-warm-gray/24"
            style={{ transform: `rotate(${orbitRotate * -0.45}deg)` }}
          />

          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
            <path
              d="M 15 54 C 29 16, 72 13, 86 43 C 99 72, 56 92, 24 73"
              fill="none"
              stroke="rgba(139,58,42,0.24)"
              strokeWidth="0.22"
              strokeDasharray="1.5 1.7"
              strokeDashoffset={rm ? 0 : 18 - orbitT * 18}
            />
            <path
              d="M 19 38 C 42 74, 70 76, 84 51 C 94 29, 62 18, 39 23"
              fill="none"
              stroke="rgba(82,105,86,0.24)"
              strokeWidth="0.22"
              strokeDasharray="1 2.1"
              strokeDashoffset={rm ? 0 : -14 + orbitT * 14}
            />
          </svg>
        </div>
      </div>

      {/* Evidence nodes orbit instead of photo cards. */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${orbitRotate}deg)` }}
      >
        {evidence.map((item) => {
          const enter = rm ? 1 : mapRange(p, 0.22 + item.delay, 0.34 + item.delay, 0, 1);
          const fade = rm ? 1 : enter * (1 - mapRange(p, 0.43 + item.delay, 0.50 + item.delay, 0, 0.35));
          const angle = (item.angle * Math.PI) / 180;
          const x = Math.cos(angle) * item.radius;
          const y = Math.sin(angle) * item.radius * 0.62;
          const lineScale = rm ? 1 : mapRange(p, 0.24 + item.delay, 0.38 + item.delay, 0, 1);

          return (
            <div
              key={item.id}
              className="absolute left-1/2 top-1/2"
              style={{
                opacity: fade,
                transform: `translate(-50%, -50%) translate(${x}vw, ${y}vh) rotate(${-orbitRotate}deg) scale(${0.86 + enter * 0.14})`,
              }}
            >
              <div className="relative flex items-center gap-3">
                <span
                  className="block h-2.5 w-2.5 rounded-full ring-4 ring-paper/70"
                  style={{ backgroundColor: item.color }}
                />
                <span
                  className="block h-px w-10 origin-left bg-gradient-to-r from-rust/35 to-transparent"
                  style={{ transform: `scaleX(${lineScale})` }}
                  aria-hidden="true"
                />
                <span className="whitespace-nowrap border border-warm-gray/26 bg-paper/68 px-3 py-1.5 font-body text-[10px] uppercase tracking-[0.16em] text-ink/72 shadow-[0_16px_40px_-32px_rgba(26,26,22,0.3)] backdrop-blur-md">
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="absolute bottom-20 left-8 right-8 md:left-16 md:right-auto md:max-w-md"
        style={{
          opacity: rm ? 1 : mapRange(p, 0.28, 0.40, 0, 1) * (1 - mapRange(p, 0.45, 0.52, 0, 1)),
          transform: `translateY(${rm ? 0 : mapRange(p, 0.26, 0.40, 28, 0)}px)`,
        }}
      >
        <div className="mb-5 h-px w-24 bg-gradient-to-r from-rust/45 to-transparent" />
        <h2 className="font-display text-h3 md:text-h2 font-bold leading-[1.05] text-ink">
          {t('home.narrative.scene02.title', 'Proof moves quietly around the product.')}
        </h2>
        <p className="mt-4 max-w-sm font-body text-body-sm leading-[1.8] text-ink-faded">
          {t(
            'home.narrative.scene02.body',
            'Each waypoint becomes a small verified signal, orbiting the same material journey instead of interrupting it with a separate gallery.',
          )}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Scene 03 — Impact Numbers (40% → 72%)
   ═══════════════════════════════════════════════════════════════ */

function Scene03({ p, rm, mapRange, t }: SceneProps & NarrativeTProps) {
  // Layer: visible 40–72%
  const opacity = rm ? 1
    : mapRange(p, 0.40, 0.48, 0, 1) * (1 - mapRange(p, 0.66, 0.72, 0, 1));
  const layerY = rm ? 0 : mapRange(p, 0.40, 0.52, 60, 0);

  const stats = [
    { value: 2847, labelKey: 'home.impact.children' as const, prefix: '' },
    { value: 12563, labelKey: 'home.impact.artworks' as const, prefix: '' },
    { value: 890000, labelKey: 'home.impact.donated' as const, prefix: '¥' },
    { value: 5420, labelKey: 'home.impact.products' as const, prefix: '' },
  ];

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ opacity, transform: `translateY(${layerY}px)`, zIndex: 3 }}
    >
      {/* Scene number */}
      <div className="absolute top-16 left-8 md:left-16 z-20">
        <span className="font-body text-caption text-sepia-mid tracking-[0.3em]">03</span>
      </div>

      <div
        className="text-center mb-14"
        style={{ transform: `translateY(${rm ? 0 : mapRange(p, 0.42, 0.52, 30, 0)}px)` }}
      >
        <h2 className="font-display text-h2 md:text-h1 font-bold text-ink leading-[1.05] tracking-[-0.03em]">
          {t('home.narrative.scene03.title')}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 px-8 max-w-5xl w-full">
        {stats.map((stat, i) => {
          const numT = rm ? 1 : mapRange(p, 0.46, 0.60, 0, 1);
          const display = Math.round(numT * stat.value);
          const itemOp = rm ? 1 : mapRange(p, 0.46 + i * 0.02, 0.56 + i * 0.02, 0, 1);
          const itemY = rm ? 0 : mapRange(p, 0.46 + i * 0.02, 0.56 + i * 0.02, 35, 0);

          return (
            <div
              key={stat.labelKey}
              className="relative text-center px-4 py-8"
              style={{ opacity: itemOp, transform: `translateY(${itemY}px)` }}
            >
              {/* Decorative frame */}
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px bg-rust/30" />
                <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-warm-gray/20" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-warm-gray/20" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-warm-gray/20" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-warm-gray/20" />
              </div>

              <div className="font-display text-h2 md:text-h1 font-medium text-ink leading-none tracking-wide mb-3">
                {stat.prefix}{display.toLocaleString()}
              </div>
              <div className="font-body text-caption text-sepia-mid tracking-[0.12em] uppercase">
                {t(stat.labelKey)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <div className="w-12 h-px bg-warm-gray/40" />
        <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">{t('home.narrative.scene03.established')}</span>
        <div className="w-12 h-px bg-warm-gray/40" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Scene 04 — Call to Action (65% → 100%)
   ═══════════════════════════════════════════════════════════════ */

function Scene04({
  p,
  rm,
  mapRange,
  t,
  impactMode,
}: SceneProps & NarrativeTProps & { impactMode: boolean }) {
  const goToTab = useGoToImpactTab();
  // Layer: visible 65–100%
  const opacity = rm ? 1 : mapRange(p, 0.65, 0.75, 0, 1);
  const layerY = rm ? 0 : mapRange(p, 0.68, 0.78, 50, 0);

  const scale1 = rm ? 1 : mapRange(p, 0.76, 0.86, 0.92, 1);
  const scale2 = rm ? 1 : mapRange(p, 0.79, 0.89, 0.92, 1);
  const lineWidth = rm ? 120 : mapRange(p, 0.82, 0.92, 0, 120);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-ink"
      style={{ opacity, transform: `translateY(${layerY}px)`, zIndex: 4 }}
    >
      {/* Scene number */}
      <div className="absolute top-16 left-8 md:left-16 z-20">
        <span className="font-body text-caption text-warm-gray/50 tracking-[0.3em]">04</span>
      </div>

      <div className="text-center px-8 max-w-2xl">
        <h2 className="font-display text-h2 md:text-h1 font-bold text-paper leading-[1.05] tracking-[-0.03em] mb-4">
          {impactMode
            ? t('home.impactNarrative.scene04.title', 'Every Action Leaves a Trace.')
            : t('home.narrative.scene04.title', 'Be Part of the Story')}
        </h2>
        <p className="font-body text-body-sm text-warm-gray/70 mb-12 max-w-md mx-auto leading-relaxed">
          {impactMode
            ? t(
                'home.impactNarrative.scene04.subtitle',
                'Responsible consumption, made visible — from essentials to recycled fibers.',
              )
            : t('home.narrative.scene04.subtitle', "Every purchase supports a child's creative journey. Join our community of impact.")}
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
          {impactMode ? (
            <>
              <button
                type="button"
                onClick={scrollToImpactStory}
                className="inline-block font-body text-body-sm tracking-[0.12em] uppercase bg-[#FAF8F5] text-ink px-8 py-4 hover:bg-white transition-colors duration-300 cursor-pointer rounded-full"
                style={{ transform: `scale(${scale1})` }}
              >
                {t('home.impactHero.cta.explore', 'Explore Impact')}
              </button>
              <button
                type="button"
                onClick={() => goToTab('shop')}
                className="inline-block font-body text-body-sm tracking-[0.12em] uppercase border border-[#FAF8F5]/35 text-[#FAF8F5] px-8 py-4 hover:border-[#FAF8F5]/60 transition-colors duration-300 cursor-pointer rounded-full"
                style={{ transform: `scale(${scale2})` }}
              >
                {t('home.impactHero.cta.shop', 'Shop the Collaboration')}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/traceability"
                className="inline-block font-body text-body-sm tracking-[0.15em] uppercase bg-rust text-paper px-8 py-4 hover:bg-rust-light transition-colors duration-300"
                style={{ transform: `scale(${scale1})` }}
              >
                {t('home.narrative.scene04.traceability', 'Explore Traceability')}
              </Link>
              <Link
                to="/campaigns"
                className="inline-block font-body text-body-sm tracking-[0.15em] uppercase border border-sage/40 text-sage-pale px-8 py-4 hover:border-sage hover:text-paper transition-colors duration-300"
                style={{ transform: `scale(${scale2})` }}
              >
                {t('home.narrative.scene04.campaign', 'Join Campaign')}
              </Link>
              <Link
                to="/donate"
                className="inline-block font-body text-body-sm tracking-[0.15em] uppercase border border-warm-gray/40 text-warm-gray px-8 py-4 hover:border-warm-gray hover:text-paper transition-colors duration-300"
                style={{ transform: `scale(${scale1})` }}
              >
                {t('home.narrative.scene04.donate', 'Make Donation')}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Bottom decorative line */}
      <div
        className="absolute bottom-20 h-px bg-gradient-to-r from-transparent via-sage/30 to-transparent"
        style={{ width: `${lineWidth}%` }}
      />
    </div>
  );
}
