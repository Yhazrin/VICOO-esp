import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { TextScramble } from '@/components/animations/TextScramble';
import { OrigamiPaperStrip } from '@/components/animations/OrigamiFold';

interface EditorialHeroProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  align?: 'left' | 'center';
  fullBleed?: boolean;
  fullHeight?: boolean;
  hideHero?: boolean;
  scrambleTitle?: boolean;
  scrambleDuration?: number;
}

export default function EditorialHero({
  title,
  subtitle,
  children,
  align = 'left',
  fullBleed = true,
  fullHeight = false,
  hideHero = false,
  scrambleTitle = false,
  scrambleDuration = 1200,
}: EditorialHeroProps) {
  const { t } = useTranslation();
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const prefersReducedMotion = useReducedMotion();

  // Dynamic viewport height for iOS Safari 100dvh stability
  // This hook provides a stable height value that handles:
  // 1. iOS Safari address bar show/hide on scroll
  // 2. Tab switching causing viewport changes
  // 3. Mobile browser chrome adjustments
  const [dynamicVh, setDynamicVh] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return window.innerHeight;
  });

  useEffect(() => {
    const updateVh = () => {
      // Use the smaller of innerHeight and clientHeight to avoid Safari tab bar issues
      // This provides a stable fallback for 100dvh
      const vh = window.innerHeight;
      const dvh = document.documentElement.clientHeight;
      setDynamicVh(Math.min(vh, dvh));
    };

    // Debounced resize handler
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateVh, 100);
    };

    // Handle orientation change on mobile
    const handleOrientationChange = () => {
      setTimeout(updateVh, 200);
    };

    // Handle tab switching (visibility change) - critical for 100dvh stability
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateVh();
      }
    };

    // Initial update
    updateVh();

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeoutId);
    };
  }, []);

  // Scroll-linked parallax values
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // For fullHeight sections, reduce parallax range to prevent decorations from going out of bounds
  // Full-height sections use dynamicVh which is stable but may be slightly smaller than viewport
  const parallaxMultiplier = fullHeight ? 0.5 : 1;

  // Background layer moves slowest (0.2x scroll speed) - distant decorative elements
  const backgroundY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion
      ? ['0px', '0px']
      : ['0px', `${-80 * parallaxMultiplier}px`]
  );

  // Midground layer moves at medium speed (0.4x) - abstract shapes
  const midgroundY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion
      ? ['0px', '0px']
      : ['0px', `${-50 * parallaxMultiplier}px`]
  );

  // Foreground decorative elements move faster (0.6x) but still subtle
  const foregroundY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion
      ? ['0px', '0px']
      : ['0px', `${-25 * parallaxMultiplier}px`]
  );

  if (hideHero) {
    return null;
  }

  // Height based on viewport coverage - use dynamic value for fullHeight sections
  // This ensures stable 100vh-like behavior across browsers including iOS Safari
  const heightStyle = fullHeight
    ? { minHeight: dynamicVh > 0 ? `${dynamicVh}px` : '100vh' }
    : fullBleed && dynamicVh > 0
      ? { minHeight: `${Math.round(dynamicVh * 0.85)}px` }
      : undefined;

  // For fullHeight, we use an expanded container for parallax decorations
  // to prevent them from being clipped during scroll
  const parallaxContainerClass = fullHeight
    ? 'inset-[-5%] sm:inset-[-10%]'
    : 'inset-0 overflow-hidden';

  return (
    <section
      ref={ref}
      style={heightStyle}
      className={`
        relative overflow-hidden
        ${fullHeight ? '' : fullBleed ? 'min-h-[70dvh] md:min-h-[85dvh]' : 'min-h-[60dvh] md:min-h-[70dvh]'}
        flex flex-col justify-center
        ${align === 'center' ? 'text-center items-center' : ''}
      `}
    >
      {/* Top gradient fade for smooth transition from header */}
      <div className="absolute inset-0 bg-gradient-to-b from-paper/80 to-transparent pointer-events-none" aria-hidden="true" />

      {/* Parallax decorative layers - only when visible and motion allowed */}
      {isVisible && !prefersReducedMotion && (
        <>
          {/* Background layer - large abstract shapes, moves slowest */}
          <motion.div
            className={`absolute pointer-events-none ${parallaxContainerClass}`}
            style={{ y: backgroundY }}
            aria-hidden="true"
          >
            {/* Large decorative circle top-right */}
            <div
              className="absolute -top-[10%] -right-[5%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px]
                         rounded-full border border-sepia-mid/10"
            />
            {/* Large faded rectangle bottom-left */}
            <div
              className="absolute -bottom-[5%] -left-[10%] w-[55vw] h-[35vh]
                         bg-gradient-to-br from-warm-gray/15 to-transparent transform rotate-[-5deg]"
            />
          </motion.div>

          {/* Midground layer - geometric accents */}
          <motion.div
            className={`absolute pointer-events-none ${parallaxContainerClass}`}
            style={{ y: midgroundY }}
            aria-hidden="true"
          >
            {/* Decorative vertical line left */}
            <div
              className="absolute left-[12%] top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-sepia-mid/15 to-transparent"
            />
            {/* Decorative horizontal line */}
            <div
              className="absolute left-[5%] right-[5%] top-[45%] h-px bg-gradient-to-r from-transparent via-warm-gray/20 to-transparent"
            />
            {/* Small accent squares */}
            <div className="absolute right-[18%] top-[30%] w-3 h-3 border border-sepia-mid/20 rotate-45" />
            <div className="absolute right-[23%] top-[35%] w-2 h-2 bg-rust/10 rotate-12" />
          </motion.div>

          {/* Foreground layer - subtle grain texture overlay, moves fastest */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.012]"
            style={{ y: foregroundY }}
            aria-hidden="true"
          >
            {/* Noise/grain pattern using repeating linear gradients */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    color-mix(in srgb, var(--color-sepia-mid) 30%, transparent) 2px,
                    color-mix(in srgb, var(--color-sepia-mid) 30%, transparent) 4px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 2px,
                    color-mix(in srgb, var(--color-sepia-mid) 30%, transparent) 2px,
                    color-mix(in srgb, var(--color-sepia-mid) 30%, transparent) 4px
                  )
                `,
              }}
            />
          </motion.div>
        </>
      )}

      <div
        className={`
          relative z-10 w-full px-6 md:px-10
          ${fullHeight || fullBleed ? 'max-w-[1400px] mx-auto' : 'max-w-[1400px] mx-auto'}
        `}
      >
        <motion.span
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? (isVisible ? { opacity: 1 } : {}) : (isVisible ? { opacity: 1, y: 0 } : {})}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
          className="block font-body text-caption text-sepia-mid tracking-[0.3em] mb-6 md:mb-8"
        >
          Vision In Creative Opportunity
        </motion.span>

        <motion.h1
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
          animate={prefersReducedMotion ? (isVisible ? { opacity: 1 } : {}) : (isVisible ? { opacity: 1, y: 0 } : {})}
          transition={{ duration: 0.8, ease: [0, 0, 0.2, 1], delay: 0.1 }}
          className="font-display text-hero font-black leading-[0.92] tracking-[-0.035em] text-ink"
          style={{
            marginLeft: align === 'left' ? '-0.04em' : undefined,
            marginRight: align === 'left' ? '-0.04em' : undefined,
          }}
        >
          {scrambleTitle ? (
            <TextScramble
              text={title}
              trigger="onMount"
              duration={scrambleDuration}
              className="inline-block"
              reducedMotion={prefersReducedMotion ? true : undefined}
            />
          ) : (
            title
          )}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? (isVisible ? { opacity: 1 } : {}) : (isVisible ? { opacity: 1, y: 0 } : {})}
            transition={{ duration: 0.7, ease: [0, 0, 0.2, 1], delay: 0.25 }}
            className={`
              font-body text-base md:text-lg text-ink-faded mt-4 md:mt-6 leading-relaxed max-w-xl
              ${align === 'center' ? 'max-w-2xl text-center mx-auto' : ''}
            `}
          >
            {subtitle}
          </motion.p>
        )}

        {children && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? (isVisible ? { opacity: 1 } : {}) : (isVisible ? { opacity: 1, y: 0 } : {})}
            transition={{ duration: 0.7, ease: [0, 0, 0.2, 1], delay: 0.4 }}
            className="mt-6 md:mt-8"
          >
            {children}
          </motion.div>
        )}
      </div>

      {/* Scroll indicator for full height sections - positioned above origami */}
      {(fullHeight || fullBleed) && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 1, duration: 0.6 }}
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ bottom: fullHeight ? 'calc(var(--origami-height, 24px) + 24px)' : '32px' }}
        >
          <span className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid">
            {t('common.scroll')}
          </span>
          {prefersReducedMotion ? (
            <div className="w-px h-8 bg-gradient-to-b from-sepia-mid/40 to-transparent" aria-hidden="true" />
          ) : (
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="w-px h-8 bg-gradient-to-b from-sepia-mid/40 to-transparent"
              aria-hidden="true"
            />
          )}
        </motion.div>
      )}

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warm-gray/40 to-transparent" aria-hidden="true" />

      {/* Origami folded paper effect at bottom */}
      {/* For fullHeight sections, origami sits at the very bottom */}
      <motion.div
        initial={prefersReducedMotion ? undefined : { opacity: 0, scaleX: 0 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute left-0 right-0 flex justify-center"
        style={{ bottom: fullHeight ? 0 : undefined }}
        aria-hidden="true"
      >
        {/* Origami fold strip */}
        <OrigamiPaperStrip
          orientation="horizontal"
          foldCount={5}
          color="aged"
          animated={false}
          className={fullHeight ? 'translate-y-full' : 'translate-y-1/2'}
        />

        {/* Fold shadow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, color-mix(in srgb, var(--color-ink) 4%, transparent), transparent)',
          }}
        />
      </motion.div>

      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none" aria-hidden="true">
        <OrigamiPaperStrip
          orientation="vertical"
          foldCount={3}
          color="paper"
          animated={false}
          className="h-full"
        />
      </div>
    </section>
  );
}
