import { type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface ScrollFadeTransitionProps {
  /**
   * Child elements to render
   */
  children: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Scroll progress threshold where fade starts (0 = top of viewport)
   * @default 0.1
   */
  fadeStart?: number;
  /**
   * Scroll progress threshold where element is fully visible (peak)
   * @default 0.2
   */
  fadePeak?: number;
  /**
   * Scroll progress threshold where element starts fading out
   * @default 0.8
   */
  fadeEnd?: number;
  /**
   * How much to translate vertically during fade (px)
   * @default 40
   */
  translateDistance?: number;
  /**
   * Stagger delay for child elements (seconds)
   */
  staggerDelay?: number;
}

/**
 * ScrollFadeTransition - Creates smooth scroll-driven fade animations
 * that maintain continuity from the ScrollNarrative hero section.
 *
 * Provides opacity and translateY animations that sync with scroll position,
 * creating a seamless transition between sections.
 */
export default function ScrollFadeTransition({
  children,
  className = '',
  fadeStart = 0.1,
  fadePeak = 0.2,
  fadeEnd = 0.8,
  translateDistance = 40,
  staggerDelay = 0,
}: ScrollFadeTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const opacity = useTransform(
    scrollYProgress,
    [fadeStart, fadePeak, fadeEnd],
    prefersReducedMotion ? [1, 1, 1] : [0, 1, 0]
  );

  const y = useTransform(
    scrollYProgress,
    [fadeStart, fadePeak, fadeEnd],
    prefersReducedMotion ? [0, 0, 0] : [translateDistance, 0, 0]
  );

  return (
    <motion.div
      className={className}
      style={{ opacity, y }}
    >
      {staggerDelay > 0 ? (
        <StaggeredChildren staggerDelay={staggerDelay}>
          {children}
        </StaggeredChildren>
      ) : (
        children
      )}
    </motion.div>
  );
}

/**
 * StaggeredChildren - Applies staggered animation to direct children
 */
function StaggeredChildren({
  children,
  staggerDelay,
}: {
  children: ReactNode;
  staggerDelay: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {/* Each direct child gets the staggered animation */}
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                  },
                },
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

/**
 * SectionDivider - Editorial-style section divider with scroll animation
 */
export function SectionDivider({
  className = '',
}: {
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const width = useTransform(
    scrollYProgress,
    [0.3, 0.5],
    prefersReducedMotion ? [100, 100] : [0, 100]
  );

  return (
    <div className={`relative h-px bg-warm-gray/40 ${className}`}>
      <motion.div
        className="absolute inset-y-0 left-0 bg-rust/30"
        style={{ width }}
      />
    </div>
  );
}
