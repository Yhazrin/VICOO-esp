import { useRef, type RefObject } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Hook to create scroll-linked path drawing animation
 * Uses stroke-dasharray and stroke-dashoffset technique
 */
export function useScrollPathDraw(
  containerRef: RefObject<HTMLElement | null>
) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return { progress: scrollYProgress, pathLength };
}

/**
 * MotionPath - Direct scroll-driven path animation
 * Uses framer-motion's motion.path with scroll-linked progress
 *
 * @example
 * ```tsx
 * <MotionPath
 *   d="M0 50 Q 100 0 200 50 T 400 50"
 *   strokeColor="#8B3A2A"
 *   strokeWidth={2}
 *   fill="none"
 * />
 * ```
 */
interface MotionPathProps {
  d: string;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fill?: string;
  containerRef?: RefObject<HTMLElement | null>;
}

export function MotionPath({
  d,
  className = '',
  strokeColor = 'var(--color-rust)', // rust default
  strokeWidth = 2,
  fill = 'none',
  containerRef,
}: MotionPathProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const pathLength = 1000; // Approximate path length for normalization
  const strokeDashoffset = useTransform(scrollYProgress, [0, 1], [pathLength, 0]);

  if (prefersReducedMotion) {
    return (
      <path
        d={d}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      />
    );
  }

  return (
    <motion.path
      d={d}
      fill={fill}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: pathLength,
        strokeDashoffset,
      }}
      className={className}
    />
  );
}

/**
 * ScrollPathDrawInline - Decorative path that draws on scroll
 * Simplified API for common decorative patterns
 *
 * @example
 * ```tsx
 * // Decorative wave divider
 * <ScrollPathDrawInline
 *   path="M0,20 Q50,0 100,20 T200,20 T300,20"
 *   className="w-full h-8 text-rust"
 * />
 *
 * // Underline for quotes
 * <ScrollPathDrawInline
 *   path="M0,0 L100,0"
 *   className="w-24 h-1 text-rust"
 * />
 * ```
 */
interface ScrollPathDrawInlineProps {
  /** SVG path data string */
  path: string;
  /** Additional className */
  className?: string;
  /** Stroke color - defaults to rust */
  strokeColor?: string;
  /** Stroke width - defaults to 2 */
  strokeWidth?: number;
  /** Container ref for scroll tracking */
  containerRef?: RefObject<HTMLElement | null>;
  /** Animation delay in seconds (0-1 range) */
  delay?: number;
}

export function ScrollPathDrawInline({
  path,
  className = '',
  strokeColor = 'var(--color-rust)', // rust
  strokeWidth = 2,
  containerRef,
  delay = 0,
}: ScrollPathDrawInlineProps) {
  const prefersReducedMotion = useReducedMotion();
  const internalRef = useRef<HTMLDivElement>(null);
  const resolvedRef = containerRef || internalRef;

  const { scrollYProgress } = useScroll({
    target: resolvedRef,
    offset: ['start end', 'end start'],
  });

  // Scale offset based on delay
  const strokeDashoffset = useTransform(
    scrollYProgress,
    [0, 1],
    [1000 * (1 + delay), 0]
  );

  return (
    <div ref={internalRef} className={`inline-block ${className}`}>
      <svg
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        className="w-full h-full"
        aria-hidden="true"
      >
        {prefersReducedMotion ? (
          <path
            d={path}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <motion.path
            d={path}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset,
            }}
          />
        )}
      </svg>
    </div>
  );
}

export default MotionPath;
