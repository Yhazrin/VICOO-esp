import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';
import { artworksApi } from '@/services/artworks';

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

  // Fetch real artworks for the gallery scene
  const { data: artworksData } = useQuery({
    queryKey: ['scroll-narrative-artworks'],
    queryFn: () => artworksApi.getAll({ page_size: 5 }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const artworkImages = (artworksData?.items ?? [])
    .slice(0, 5)
    .map((a) => a.image_url)
    .filter(Boolean) as string[];

  // Scroll tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const ch = container.offsetHeight;
      // rect.top is 0 when the sticky container is pinned at viewport top.
      // As user scrolls down, rect.top goes negative (container scrolls up).
      // scrollProgress = how far through the 500vh container we've scrolled.
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
    <div ref={containerRef} className="relative w-full" style={{ height: '500vh' }}>
      <div
        className="sticky overflow-hidden"
        style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', zIndex: 10 }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-aged-stock" />

        {/* Scene 01 — Brand Manifesto */}
        <Scene01 p={p} rm={rm} mapRange={mapRange} t={t} />

        {/* Scene 02 — Artwork Gallery */}
        <Scene02 p={p} rm={rm} mapRange={mapRange} images={artworkImages} />

        {/* Scene 03 — Impact Numbers */}
        <Scene03 p={p} rm={rm} mapRange={mapRange} />

        {/* Scene 04 — Call to Action */}
        <Scene04 p={p} rm={rm} mapRange={mapRange} t={t} />

        <SectionGrainOverlay opacity={0.03} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Scene 01 — Brand Manifesto (0 → 28%)
   ═══════════════════════════════════════════════════════════════ */

function Scene01({ p, rm, mapRange, t }: SceneProps & { t: (key: string, fallback: string) => string }) {
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
                {t('home.narrative.scene01.line1', 'Every Thread,')}
              </span>
            </div>
            <div className="overflow-hidden mt-1">
              <span className="inline-block" style={{ transform: `translateY(${line2}%)` }}>
                {t('home.narrative.scene01.line2', 'Traced from')}{' '}
              </span>
            </div>
            <div className="overflow-hidden mt-1">
              <span className="inline-block text-rust" style={{ transform: `translateY(${line3}%)` }}>
                {t('home.narrative.scene01.line3', 'Source to Stitch')}
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
              {t('home.narrative.scene01.subtitle', 'From organic cotton fields to finished garments — verified at every step.')}
            </p>
            <p className="font-body text-caption text-sepia-mid tracking-[0.1em] uppercase mt-6">
              {t('home.globe.label', 'Model A — Traceability')}
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
        <span className="font-body text-[10px] text-sepia-mid tracking-[0.25em] uppercase">Scroll</span>
        <div className="w-px h-6 bg-gradient-to-b from-sepia-mid/40 to-transparent" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Scene 02 — Artwork Gallery (18% → 52%)
   ═══════════════════════════════════════════════════════════════ */

function Scene02({ p, rm, mapRange, images }: Scene02Props) {
  // Layer: visible 18–52%
  const opacity = rm ? 1
    : mapRange(p, 0.18, 0.24, 0, 1) * (1 - mapRange(p, 0.46, 0.52, 0, 1));

  const layerY = rm ? 0 : mapRange(p, 0.18, 0.28, 50, 0);

  const positions = [
    { x: '8%', y: '18%', w: 'w-40 md:w-56', rot: -2.5 },
    { x: '55%', y: '12%', w: 'w-36 md:w-48', rot: 1.8 },
    { x: '28%', y: '52%', w: 'w-44 md:w-60', rot: -1 },
    { x: '68%', y: '48%', w: 'w-32 md:w-44', rot: 3 },
    { x: '42%', y: '30%', w: 'w-36 md:w-52', rot: 0.5 },
  ];

  // Merge API images with fallback gradients — use API images first, fill remaining slots
  const fallbackGradients = [
    'linear-gradient(135deg, #C4A45A 0%, #8B7355 100%)',
    'linear-gradient(135deg, #8B3A2A 0%, #C4A45A 100%)',
    'linear-gradient(135deg, #5A7A5A 0%, #8B7355 100%)',
    'linear-gradient(135deg, #D4C5A9 0%, #8B3A2A 100%)',
    'linear-gradient(135deg, #7D8471 0%, #C4A45A 100%)',
  ];
  const srcs = images.length > 0 ? images.concat([]).slice(0, 5) : [];

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
          "Where imagination meets fabric, stories are worn."
        </p>
      </div>

      {/* Artwork cards */}
      {positions.map((pos, i) => {
        const delay = i * 0.03;
        const enterX = rm ? 0 : mapRange(p, 0.19 + delay, 0.30 + delay, i % 2 === 0 ? -70 : 70, 0);
        const enterSc = rm ? 1 : mapRange(p, 0.19 + delay, 0.30 + delay, 0.75, 1);
        const cardOp = rm ? 1 : mapRange(p, 0.19 + delay, 0.28 + delay, 0, 1);

        return (
          <div
            key={i}
            className={`absolute ${pos.w} aspect-[4/5] border-2 border-warm-gray/30 bg-aged-stock overflow-hidden shadow-lg`}
            style={{
              left: pos.x,
              top: pos.y,
              transform: `rotate(${pos.rot}deg) translateX(${enterX}px) scale(${enterSc})`,
              opacity: cardOp,
            }}
          >
            {srcs[i] ? (
              <img
                src={srcs[i]}
                alt={`Children's artwork ${i + 1}`}
                className="w-full h-full object-cover"
                style={{ filter: 'sepia(0.15) contrast(1.05) brightness(0.97)' }}
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: fallbackGradients[i] }}
              />
            )}
            {/* Corner accents */}
            <div className="absolute top-1.5 left-1.5 w-5 h-5 border-t border-l border-rust/25" />
            <div className="absolute bottom-1.5 right-1.5 w-5 h-5 border-b border-r border-rust/25" />
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Scene 03 — Impact Numbers (40% → 72%)
   ═══════════════════════════════════════════════════════════════ */

function Scene03({ p, rm, mapRange }: SceneProps) {
  // Layer: visible 40–72%
  const opacity = rm ? 1
    : mapRange(p, 0.40, 0.48, 0, 1) * (1 - mapRange(p, 0.66, 0.72, 0, 1));
  const layerY = rm ? 0 : mapRange(p, 0.40, 0.52, 60, 0);

  const stats = [
    { value: 2847, label: 'Children Empowered', prefix: '' },
    { value: 12563, label: 'Artworks Created', prefix: '' },
    { value: 890000, label: 'Donated', prefix: '¥' },
    { value: 5420, label: 'Products Made', prefix: '' },
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
          Impact in Numbers
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
              key={stat.label}
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
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <div className="w-12 h-px bg-warm-gray/40" />
        <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">EST. 2024</span>
        <div className="w-12 h-px bg-warm-gray/40" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Scene 04 — Call to Action (65% → 100%)
   ═══════════════════════════════════════════════════════════════ */

function Scene04({ p, rm, mapRange, t }: SceneProps & { t: (key: string, fallback: string) => string }) {
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
          {t('home.narrative.scene04.title', 'Be Part of the Story')}
        </h2>
        <p className="font-body text-body-sm text-warm-gray/70 mb-12 max-w-md mx-auto leading-relaxed">
          {t('home.narrative.scene04.subtitle', "Every purchase supports a child's creative journey. Join our community of impact.")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

/* ═══════════════════════════════════════════════════════════════
   Shared types
   ═══════════════════════════════════════════════════════════════ */

interface SceneProps {
  p: number;
  rm: boolean;
  mapRange: (v: number, i0: number, i1: number, o0: number, o1: number) => number;
}

interface Scene02Props extends SceneProps {
  images: string[];
}
