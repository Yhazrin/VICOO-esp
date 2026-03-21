import { type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useMediaQuery } from '@/hooks/useMediaQuery';
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
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Scroll-linked parallax values
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Background layer moves slowest (0.2x scroll speed) - distant decorative elements
  const backgroundY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ['0px', '0px'] : ['0px', '-120px']
  );

  // Midground layer moves at medium speed (0.4x) - abstract shapes
  const midgroundY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ['0px', '0px'] : ['0px', '-80px']
  );

  // Foreground decorative elements move faster (0.6x) but still subtle
  const foregroundY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ['0px', '0px'] : ['0px', '-40px']
  );

  if (hideHero) {
    return null;
  }

  // Height based on viewport coverage
  let heightClass = 'min-h-[60dvh] md:min-h-[70dvh]';
  if (fullHeight) {
    heightClass = 'min-h-[100dvh]';
  } else if (fullBleed) {
    heightClass = 'min-h-[70dvh] md:min-h-[85dvh]';
  }

  return (
    <section
      ref={ref}
      className={`
        relative overflow-hidden
        ${heightClass}
        flex flex-col justify-center
        ${align === 'center' ? 'text-center items-center' : ''}
      `}
    >
      {/* Top gradient fade for smooth transition from header */}
      <div className="absolute inset-0 bg-gradient-to-b from-paper/80 to-transparent pointer-events-none" />

      {/* Parallax decorative layers - only when visible and motion allowed */}
      {isVisible && !prefersReducedMotion && (
        <>
          {/* Background layer - large abstract shapes, moves slowest */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ y: backgroundY }}
            aria-hidden="true"
          >
            {/* Large decorative circle top-right */}
            <div
              className="absolute -top-20 -right-20 w-[40vw] h-[40vw] max-w-[600px] max-h-[600px]
                         rounded border border-sepia-mid/10"
            />
            {/* Large faded rectangle bottom-left */}
            <div
              className="absolute -bottom-10 -left-10 w-[50vw] h-[30dvh]
                         bg-gradient-to-br from-warm-gray/20 to-transparent transform rotate-[-5deg]"
            />
          </motion.div>

          {/* Midground layer - geometric accents */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ y: midgroundY }}
            aria-hidden="true"
          >
            {/* Decorative vertical line left */}
            <div
              className="absolute left-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-sepia-mid/15 to-transparent"
            />
            {/* Decorative horizontal line */}
            <div
              className="absolute left-0 right-0 top-[40%] h-px bg-gradient-to-r from-transparent via-warm-gray/20 to-transparent"
            />
            {/* Small accent squares */}
            <div className="absolute right-[20%] top-[25%] w-3 h-3 border border-sepia-mid/20 rotate-45" />
            <div className="absolute right-[25%] top-[30%] w-2 h-2 bg-rust/10 rotate-12" />
          </motion.div>

          {/* Foreground layer - subtle grain texture overlay, moves fastest */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.015]"
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
          relative z-10 w-full px-6 md:px-10 pt-24 md:pt-28
          ${align === 'center' ? 'mx-auto' : ''}
          ${fullHeight || fullBleed ? 'max-w-[1400px] mx-auto' : 'max-w-[1400px] mx-auto'}
        `}
      >
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
          className="block font-body text-caption text-sepia-mid tracking-[0.3em] mb-6 md:mb-8"
        >
          Vision In Creative Opportunity
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
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
              reducedMotion={prefersReducedMotion}
            />
          ) : (
            title
          )}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0, 0, 0.2, 1], delay: 0.25 }}
            className={`
              font-body text-base md:text-lg text-ink-faded mt-6 md:mt-8 leading-relaxed max-w-xl
              ${align === 'center' ? 'max-w-2xl text-center mx-auto' : ''}
            `}
          >
            {subtitle}
          </motion.p>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0, 0, 0.2, 1], delay: 0.4 }}
            className="mt-8 md:mt-10"
          >
            {children}
          </motion.div>
        )}
      </div>

      {/* Scroll indicator for full height sections */}
      {(fullHeight || fullBleed) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 1, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid">
            Scroll
          </span>
          {prefersReducedMotion ? (
            <div className="w-px h-8 bg-gradient-to-b from-sepia-mid/40 to-transparent" />
          ) : (
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="w-px h-8 bg-gradient-to-b from-sepia-mid/40 to-transparent"
            />
          )}
        </motion.div>
      )}

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warm-gray/40 to-transparent" />

      {/* Origami folded paper effect at bottom */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute bottom-0 left-0 right-0 flex justify-center"
        aria-hidden="true"
      >
        {/* Origami fold strip */}
        <OrigamiPaperStrip
          orientation="horizontal"
          foldCount={5}
          color="aged"
          animated={false}
          className="transform translate-y-1/2"
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
