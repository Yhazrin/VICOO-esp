import { useRef, useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import SectionGrainOverlay from '@/components/editorial/SectionGrainOverlay';

/**
 * ScrollNarrative — Apple-style scroll-driven animation
 *
 * Architecture:
 * - 500vh container creates scroll space
 * - Sticky viewport (100vh) stays fixed during scroll
 * - Scroll progress (0→1) drives all animations via useTransform
 * - Each layer is absolutely positioned and animated based on scroll progress
 *
 * Key: position: sticky works because parent (500vh div) has no overflow constraint
 */
export default function ScrollNarrative() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion() ?? false;

  // Reliable scroll tracking using native events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const containerHeight = container.offsetHeight;

      // Calculate progress: 0 when container top hits viewport top, 1 when container bottom hits viewport bottom
      const scrolled = viewportHeight - rect.top;
      const totalScrollable = containerHeight - viewportHeight;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));

      setScrollProgress(progress);
    };

    // Initial calculation
    handleScroll();

    // Throttled scroll listener
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
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

  // Helper to create scroll-based interpolation
  const lerp = useCallback((start: number, end: number, t: number) => {
    return start + (end - start) * t;
  }, []);

  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  }, []);

  const mapRange = useCallback((value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
    const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
    return lerp(outMin, outMax, t);
  }, [clamp, lerp]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: '500vh' }}>
      {/* Sticky viewport - stays fixed while user scrolls */}
      <div
        className="sticky overflow-hidden"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          zIndex: 10,
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-aged-stock" />

        {/* Layer 1: Geometric lines — continuous horizontal flow */}
        <GeometricLines
          scrollProgress={scrollProgress}
          prefersReducedMotion={prefersReducedMotion}
          mapRange={mapRange}
        />

        {/* Layer 2: Title emergence — fades out as scroll progresses */}
        <TitleLayer
          scrollProgress={scrollProgress}
          prefersReducedMotion={prefersReducedMotion}
          mapRange={mapRange}
        />

        {/* Layer 3: Artwork grid — converges then disperses */}
        <ArtworkLayer
          scrollProgress={scrollProgress}
          prefersReducedMotion={prefersReducedMotion}
          mapRange={mapRange}
        />

        {/* Layer 4: Flow ribbons — continuous horizontal movement */}
        <RibbonLayer
          scrollProgress={scrollProgress}
          prefersReducedMotion={prefersReducedMotion}
          mapRange={mapRange}
        />

        {/* Layer 5: Impact stats — numbers animate, then layer fades */}
        <ImpactLayer
          scrollProgress={scrollProgress}
          prefersReducedMotion={prefersReducedMotion}
          mapRange={mapRange}
        />

        {/* Layer 6: CTA — fades in at the end */}
        <CTALayer
          scrollProgress={scrollProgress}
          prefersReducedMotion={prefersReducedMotion}
          mapRange={mapRange}
        />

        {/* Grain overlay for texture */}
        <SectionGrainOverlay opacity={0.035} />
      </div>
    </div>
  );
}

/* ─── Layer Components ─── */

function GeometricLines({
  scrollProgress,
  prefersReducedMotion,
  mapRange,
}: {
  scrollProgress: number;
  prefersReducedMotion: boolean;
  mapRange: (v: number, iMin: number, iMax: number, oMin: number, oMax: number) => number;
}) {
  if (prefersReducedMotion) return null;

  const line1X = mapRange(scrollProgress, 0, 1, -100, 100);
  const line2X = mapRange(scrollProgress, 0, 1, 50, -50);
  const line3X = mapRange(scrollProgress, 0, 1, -50, 150);
  const lineOpacity = mapRange(scrollProgress, 0, 0.1, 0, 0.6) * (1 - mapRange(scrollProgress, 0.9, 1, 0, 1));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: lineOpacity }}>
      {/* Line 1 */}
      <div
        className="absolute h-px bg-rust/30"
        style={{
          top: '20%',
          left: 0,
          width: '40vw',
          transform: `translateX(${line1X}px)`,
        }}
      />
      {/* Line 2 */}
      <div
        className="absolute h-px bg-sage/25"
        style={{
          top: '40%',
          left: 0,
          width: '60vw',
          transform: `translateX(${line2X}px)`,
        }}
      />
      {/* Line 3 */}
      <div
        className="absolute h-px bg-sepia-mid/20"
        style={{
          top: '60%',
          left: 0,
          width: '50vw',
          transform: `translateX(${line3X}px)`,
        }}
      />
      {/* Line 4 */}
      <div
        className="absolute h-px bg-warm-gray/25"
        style={{
          top: '75%',
          left: 0,
          width: '35vw',
          transform: `translateX(${mapRange(scrollProgress, 0, 1, 100, -100)}px)`,
        }}
      />
    </div>
  );
}

function TitleLayer({
  scrollProgress,
  prefersReducedMotion,
  mapRange,
}: {
  scrollProgress: number;
  prefersReducedMotion: boolean;
  mapRange: (v: number, iMin: number, iMax: number, oMin: number, oMax: number) => number;
}) {
  // Title visible 0-35%, fades out after
  const opacity = prefersReducedMotion
    ? 1
    : 1 - mapRange(scrollProgress, 0.2, 0.4, 0, 1);

  const y = prefersReducedMotion ? 0 : mapRange(scrollProgress, 0, 0.35, 0, -80);
  const scale = prefersReducedMotion ? 1 : mapRange(scrollProgress, 0, 0.35, 1, 0.85);

  // Subtitle
  const subtitleOpacity = prefersReducedMotion
    ? 1
    : (1 - mapRange(scrollProgress, 0.25, 0.45, 0, 1));
  const subtitleY = prefersReducedMotion ? 0 : mapRange(scrollProgress, 0.08, 0.35, 30, -50);

  // Letter reveal
  const line1Y = prefersReducedMotion ? 0 : mapRange(scrollProgress, 0, 0.15, 100, 0);
  const line2Y = prefersReducedMotion ? 0 : mapRange(scrollProgress, 0.02, 0.17, 100, 0);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity }}
    >
      {/* Scene number */}
      <div className="absolute top-16 left-8 md:left-16 z-10">
        <span className="font-body text-caption text-sepia-mid tracking-[0.3em]">01</span>
      </div>

      {/* Main content */}
      <div
        className="relative z-10 text-center px-8"
        style={{ transform: `translateY(${y}px) scale(${scale})` }}
      >
        {/* Accent line */}
        <div
          className="w-16 h-px bg-rust mx-auto mb-8 origin-center"
          style={{
            transform: `scaleX(${prefersReducedMotion ? 1 : mapRange(scrollProgress, 0, 0.15, 0, 1)})`,
          }}
        />

        <h1 className="font-display text-h1 md:text-display font-bold text-ink leading-[1.05] tracking-[-0.03em]">
          <div className="overflow-hidden">
            <span
              className="inline-block"
              style={{ transform: `translateY(${line1Y}%)` }}
            >
              Every Child's Creativity
            </span>
          </div>
          <div className="overflow-hidden mt-1">
            <span
              className="inline-block"
              style={{ transform: `translateY(${line2Y}%)` }}
            >
              Deserves a Stage
            </span>
          </div>
        </h1>

        <p
          className="font-body text-body-sm text-ink-faded mt-6 tracking-wide"
          style={{ opacity: subtitleOpacity, transform: `translateY(${subtitleY}px)` }}
        >
          Where Imagination Meets Impact
        </p>

        {/* Decorative dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-warm-gray"
              style={{
                opacity: prefersReducedMotion ? 1 : mapRange(scrollProgress, 0.1 + i * 0.02, 0.2 + i * 0.02, 0, 1),
              }}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator — fades out early */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{
          opacity: prefersReducedMotion ? 1 : mapRange(scrollProgress, 0, 0.1, 0, 1) * (1 - mapRange(scrollProgress, 0.2, 0.3, 0, 1)),
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-warm-gray to-transparent" />
        </div>
      </div>
    </div>
  );
}

function ArtworkLayer({
  scrollProgress,
  prefersReducedMotion,
  mapRange,
}: {
  scrollProgress: number;
  prefersReducedMotion: boolean;
  mapRange: (v: number, iMin: number, iMax: number, oMin: number, oMax: number) => number;
}) {
  // Layer visible 12-55%
  const layerOpacity = prefersReducedMotion
    ? 0
    : mapRange(scrollProgress, 0.12, 0.18, 0, 1) * (1 - mapRange(scrollProgress, 0.45, 0.55, 0, 1));

  const layerY = prefersReducedMotion ? 0 : mapRange(scrollProgress, 0.12, 0.25, 60, 0);

  const imageOpacity = prefersReducedMotion
    ? 1
    : mapRange(scrollProgress, 0.15, 0.25, 0, 1) * (1 - mapRange(scrollProgress, 0.48, 0.55, 0, 1));

  const imagePositions = [
    { x: 10, y: 25, rotate: -3 },
    { x: 55, y: 20, rotate: 2 },
    { x: 25, y: 55, rotate: -1 },
    { x: 65, y: 60, rotate: 4 },
    { x: 40, y: 40, rotate: 0 },
    { x: 75, y: 35, rotate: -2 },
  ];

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: layerOpacity, transform: `translateY(${layerY}px)` }}
    >
      {/* Scene number */}
      <div className="absolute top-16 left-8 md:left-16 z-20">
        <span className="font-body text-caption text-sepia-mid tracking-[0.3em]">02</span>
      </div>

      {/* Images */}
      {imagePositions.map((pos, i) => {
        const entranceX = prefersReducedMotion ? 0 : mapRange(scrollProgress, 0.15 + i * 0.02, 0.3 + i * 0.02, i % 2 === 0 ? -80 : 80, 0);
        const entranceY = prefersReducedMotion ? 0 : mapRange(scrollProgress, 0.15 + i * 0.02, 0.3 + i * 0.02, i * 20, 0);
        const scale = prefersReducedMotion ? 1 : mapRange(scrollProgress, 0.15, 0.28, 0.7, 1);

        return (
          <div
            key={i}
            className="absolute w-32 h-32 md:w-44 md:h-44 border-2 border-warm-gray/40 bg-aged-stock overflow-hidden"
            style={{
              top: `${pos.y}%`,
              left: `${pos.x}%`,
              transform: `rotate(${pos.rotate}deg) translate(${entranceX}px, ${entranceY}px) scale(${scale})`,
              opacity: imageOpacity,
            }}
          >
            <img
              src={`https://picsum.photos/seed/artwork-scroll-${i}/300/300`}
              alt=""
              className="w-full h-full object-cover sepia-[0.15]"
            />
            {/* Corner accents */}
            <div className="absolute top-1 left-1 w-4 h-4 border-t border-l border-rust/30" />
            <div className="absolute bottom-1 right-1 w-4 h-4 border-b border-r border-rust/30" />
          </div>
        );
      })}
    </div>
  );
}

function RibbonLayer({
  scrollProgress,
  prefersReducedMotion,
  mapRange,
}: {
  scrollProgress: number;
  prefersReducedMotion: boolean;
  mapRange: (v: number, iMin: number, iMax: number, oMin: number, oMax: number) => number;
}) {
  if (prefersReducedMotion) return null;

  // Visible 28-72%
  const ribbonOpacity = mapRange(scrollProgress, 0.28, 0.35, 0, 0.8) * (1 - mapRange(scrollProgress, 0.65, 0.72, 0, 1));

  const ribbon1X = mapRange(scrollProgress, 0.3, 0.7, -10, 110);
  const ribbon2X = mapRange(scrollProgress, 0.3, 0.7, 5, 105);
  const ribbon3X = mapRange(scrollProgress, 0.3, 0.7, -5, 115);

  const shapes = [
    { type: 'circle', x: 15, y: 35, size: 12, color: 'bg-rust/20' },
    { type: 'rect', x: 75, y: 25, size: 16, color: 'bg-sage/15', rotate: 45 },
    { type: 'circle', x: 85, y: 65, size: 8, color: 'bg-warm-gray/20' },
    { type: 'rect', x: 25, y: 70, size: 10, color: 'bg-sepia-mid/15', rotate: 30 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: ribbonOpacity }}>
      {/* Scene number */}
      <div className="absolute top-16 left-8 md:left-16 z-20">
        <span className="font-body text-caption text-sepia-mid tracking-[0.3em]">03</span>
      </div>

      {/* SVG Ribbons */}
      <svg
        className="absolute w-[120%] h-32"
        style={{ top: '30%', transform: `translateX(${ribbon1X}%)` }}
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
      >
        <path d="M0,30 Q100,10 200,30 T400,30" fill="none" stroke="var(--color-rust)" strokeWidth="1" strokeOpacity="0.3" />
      </svg>

      <svg
        className="absolute w-[120%] h-24"
        style={{ top: '45%', transform: `translateX(${ribbon2X}%)` }}
        viewBox="0 0 400 50"
        preserveAspectRatio="none"
      >
        <path d="M0,25 Q100,5 200,25 T400,25" fill="none" stroke="var(--color-sage)" strokeWidth="1.5" strokeOpacity="0.25" />
      </svg>

      <svg
        className="absolute w-[120%] h-20"
        style={{ top: '60%', transform: `translateX(${ribbon3X}%)` }}
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
      >
        <path d="M0,20 Q100,35 200,20 T400,20" fill="none" stroke="var(--color-sepia-mid)" strokeWidth="1" strokeOpacity="0.2" />
      </svg>

      {/* Floating shapes */}
      {shapes.map((shape, i) => (
        <div
          key={i}
          className={`absolute ${shape.color}`}
          style={{
            top: `${shape.y}%`,
            left: `${shape.x}%`,
            width: shape.size,
            height: shape.size,
            borderRadius: shape.type === 'circle' ? '50%' : '2px',
            transform: `rotate(${shape.rotate}deg) translateX(${mapRange(scrollProgress, 0.35 + i * 0.05, 0.65 - i * 0.03, 0, i % 2 === 0 ? 60 : -40)}px) translateY(${mapRange(scrollProgress, 0.35, 0.65, 0, i % 2 === 0 ? -30 : 20)}px)`,
          }}
        />
      ))}
    </div>
  );
}

function ImpactLayer({
  scrollProgress,
  prefersReducedMotion,
  mapRange,
}: {
  scrollProgress: number;
  prefersReducedMotion: boolean;
  mapRange: (v: number, iMin: number, iMax: number, oMin: number, oMax: number) => number;
}) {
  // Layer visible 50-85%
  const layerOpacity = prefersReducedMotion
    ? 0
    : mapRange(scrollProgress, 0.5, 0.58, 0, 1) * (1 - mapRange(scrollProgress, 0.78, 0.85, 0, 1));

  const layerY = prefersReducedMotion ? 0 : mapRange(scrollProgress, 0.5, 0.62, 80, 0);

  const stats = [
    { value: 2847, label: 'Children Empowered', prefix: '' },
    { value: 12563, label: 'Artworks Created', prefix: '' },
    { value: 890000, label: 'Donated', prefix: '¥' },
    { value: 5420, label: 'Products Made', prefix: '' },
  ];

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ opacity: layerOpacity, transform: `translateY(${layerY}px)` }}
    >
      {/* Scene number */}
      <div className="absolute top-16 left-8 md:left-16 z-20">
        <span className="font-body text-caption text-sepia-mid tracking-[0.3em]">04</span>
      </div>

      {/* Title */}
      <div
        className="text-center mb-12"
        style={{ transform: `translateY(${prefersReducedMotion ? 0 : mapRange(scrollProgress, 0.52, 0.62, 40, 0)}px)` }}
      >
        <h2 className="font-display text-h2 md:text-h1 font-bold text-ink leading-[1.05] tracking-[-0.03em]">
          Impact in Numbers
        </h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 px-8 max-w-5xl w-full">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            stat={stat}
            index={i}
            scrollProgress={scrollProgress}
            prefersReducedMotion={prefersReducedMotion}
            mapRange={mapRange}
          />
        ))}
      </div>

      {/* Editorial divider */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <div className="w-12 h-px bg-warm-gray/40" />
        <span className="font-body text-caption text-sepia-mid tracking-[0.2em]">EST. 2024</span>
        <div className="w-12 h-px bg-warm-gray/40" />
      </div>
    </div>
  );
}

function StatCard({
  stat,
  index,
  scrollProgress,
  prefersReducedMotion,
  mapRange,
}: {
  stat: { value: number; label: string; prefix: string };
  index: number;
  scrollProgress: number;
  prefersReducedMotion: boolean;
  mapRange: (v: number, iMin: number, iMax: number, oMin: number, oMax: number) => number;
}) {
  // Number animates from 0 to target during 55%-70% of scroll
  const numberProgress = prefersReducedMotion
    ? 1
    : mapRange(scrollProgress, 0.55, 0.7, 0, 1);

  const displayValue = Math.round(numberProgress * stat.value);

  const itemOpacity = prefersReducedMotion
    ? 1
    : mapRange(scrollProgress, 0.55 + index * 0.02, 0.65 + index * 0.02, 0, 1);

  const itemY = prefersReducedMotion
    ? 0
    : mapRange(scrollProgress, 0.55 + index * 0.02, 0.65 + index * 0.02, 40, 0);

  return (
    <div
      className="relative text-center px-4 py-6"
      style={{ opacity: itemOpacity, transform: `translateY(${itemY}px)` }}
    >
      {/* Decorative frame */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px bg-rust/30" />
        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-warm-gray/20" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-warm-gray/20" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-warm-gray/20" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-warm-gray/20" />
      </div>

      {/* Number */}
      <div className="font-display text-h2 md:text-h1 font-bold text-ink leading-none tracking-tight mb-3">
        {stat.prefix}{displayValue.toLocaleString()}
      </div>

      {/* Label */}
      <div className="font-body text-caption text-sepia-mid tracking-[0.12em] uppercase">
        {stat.label}
      </div>
    </div>
  );
}

function CTALayer({
  scrollProgress,
  prefersReducedMotion,
  mapRange,
}: {
  scrollProgress: number;
  prefersReducedMotion: boolean;
  mapRange: (v: number, iMin: number, iMax: number, oMin: number, oMax: number) => number;
}) {
  // Layer visible 75-100%
  const layerOpacity = prefersReducedMotion
    ? 1
    : mapRange(scrollProgress, 0.75, 0.85, 0, 1);

  const layerY = prefersReducedMotion ? 0 : mapRange(scrollProgress, 0.78, 0.88, 60, 0);

  const scale1 = prefersReducedMotion ? 1 : mapRange(scrollProgress, 0.85, 0.95, 0.9, 1);
  const scale2 = prefersReducedMotion ? 1 : mapRange(scrollProgress, 0.87, 0.97, 0.9, 1);

  const bottomLineWidth = prefersReducedMotion ? 120 : mapRange(scrollProgress, 0.88, 0.95, 0, 120);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-ink/95"
      style={{ opacity: layerOpacity, transform: `translateY(${layerY}px)` }}
    >
      {/* Scene number */}
      <div className="absolute top-16 left-8 md:left-16 z-20">
        <span className="font-body text-caption text-warm-gray/60 tracking-[0.3em]">05</span>
      </div>

      <div className="text-center px-8 max-w-2xl">
        <h2 className="font-display text-h2 md:text-h1 font-bold text-paper leading-[1.05] tracking-[-0.03em] mb-4">
          Be Part of the Story
        </h2>
        <p className="font-body text-body-sm text-warm-gray/80 mb-10 max-w-md mx-auto">
          Every purchase supports a child's creative journey. Join our community of impact.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/campaigns"
            className="inline-block font-body text-body-sm tracking-[0.15em] uppercase bg-rust text-paper px-8 py-4"
            style={{ transform: `scale(${scale1})` }}
          >
            Join Campaign
          </a>
          <a
            href="/donate"
            className="inline-block font-body text-body-sm tracking-[0.15em] uppercase border border-sage/50 text-sage px-8 py-4"
            style={{ transform: `scale(${scale2})` }}
          >
            Make Donation
          </a>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div
        className="absolute bottom-20 h-px bg-gradient-to-r from-transparent via-sage/40 to-transparent"
        style={{ width: bottomLineWidth }}
      />
    </div>
  );
}
