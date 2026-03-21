import { useRef, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface KineticMarqueeProps {
  /**
   * Content to display in the marquee
   */
  children: ReactNode;
  /**
   * Direction of scroll: 'left' or 'right'
   * @default 'left'
   */
  direction?: 'left' | 'right';
  /**
   * Speed multiplier (higher = faster)
   * @default 1
   */
  speed?: number;
  /**
   * Whether to pause animation on hover
   * @default true
   */
  pauseOnHover?: boolean;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Gap between repeated content blocks
   * @default 'gap-8'
   */
  gap?: string;
}

/**
 * Infinite kinetic marquee component with seamless loop.
 * Uses framer Motion for GPU-accelerated smooth animation.
 */
export default function KineticMarquee({
  children,
  direction = 'left',
  speed = 1,
  pauseOnHover = true,
  className = '',
  gap = 'gap-8',
}: KineticMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Measure content width after mount
  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        const firstChild = containerRef.current.querySelector('.marquee-content') as HTMLElement;
        if (firstChild) {
          setContentWidth(firstChild.offsetWidth);
        }
      }
    };

    measureWidth();
    // Re-measure on resize
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, [children]);

  // Calculate translation distance (negative for left, positive for right)
  const translateDistance = direction === 'left' ? -contentWidth : contentWidth;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
      }}
    >
      <motion.div
        className={`flex ${gap} whitespace-nowrap marquee-content`}
        animate={{
          x: prefersReducedMotion ? undefined : isPaused ? undefined : [0, translateDistance],
        }}
        transition={prefersReducedMotion ? undefined : {
          x: {
            duration: contentWidth / (50 * speed),
            repeat: Infinity,
            ease: 'linear',
            repeatType: 'loop',
          },
        }}
        style={{ willChange: 'transform' }}
      >
        {/* First set of content */}
        <div className="flex-shrink-0 flex">
          {children}
        </div>
        {/* Duplicate set for seamless loop */}
        <div className="flex-shrink-0 flex" aria-hidden="true">
          {children}
        </div>
      </motion.div>

      {/* Fade edges for editorial feel */}
      <div
        className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-aged-stock to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-aged-stock to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Kinetic text marquee with pre-configured editorial styling.
 * Optimized for text-only content with serif typography.
 */
interface KineticTextMarqueeProps {
  /**
   * Array of text items to display
   */
  items: string[];
  /**
   * Direction of scroll
   */
  direction?: 'left' | 'right';
  /**
   * Speed multiplier
   */
  speed?: number;
  /**
   * Pause on hover
   */
  pauseOnHover?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function KineticTextMarquee({
  items,
  direction = 'left',
  speed = 1,
  pauseOnHover = true,
  className = '',
}: KineticTextMarqueeProps) {
  return (
    <div
      className={`bg-aged-stock/30 border-y border-warm-gray/40 py-4 ${className}`}
    >
      <KineticMarquee
        direction={direction}
        speed={speed}
        pauseOnHover={pauseOnHover}
        gap="gap-12"
      >
        {items.map((item, index) => (
          <span
            key={index}
            className="flex items-center"
          >
            <span className="font-display text-h4 md:text-h3 text-ink-faded italic px-6">
              {item}
            </span>
            <span className="text-rust/40 font-body text-sm">—</span>
          </span>
        ))}
      </KineticMarquee>
    </div>
  );
}

/**
 * Kinetic statistics marquee for displaying impact numbers.
 * Features large editorial-style numerals.
 */
interface KineticStatsMarqueeProps {
  /**
   * Array of stat objects with value and label
   */
  stats: Array<{
    value: string;
    label: string;
  }>;
  /**
   * Direction of scroll
   */
  direction?: 'left' | 'right';
  /**
   * Speed multiplier
   */
  speed?: number;
  /**
   * Pause on hover
   */
  pauseOnHover?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function KineticStatsMarquee({
  stats,
  direction = 'left',
  speed = 1,
  pauseOnHover = true,
  className = '',
}: KineticStatsMarqueeProps) {
  return (
    <div className={`bg-ink text-paper py-6 ${className}`}>
      <KineticMarquee
        direction={direction}
        speed={speed}
        pauseOnHover={pauseOnHover}
        gap="gap-16"
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex flex-col items-center px-8 min-w-[180px]"
          >
            <span className="font-display text-display font-bold text-pale-gold tracking-tight">
              {stat.value}
            </span>
            <span className="font-body text-caption text-paper/70 tracking-widest uppercase mt-1">
              {stat.label}
            </span>
          </div>
        ))}
      </KineticMarquee>
    </div>
  );
}
