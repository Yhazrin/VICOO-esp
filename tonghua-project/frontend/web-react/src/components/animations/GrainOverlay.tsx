import { motion } from 'framer-motion';
import { useGrainAnimation } from '../../hooks/useGrainAnimation';

/**
 * GrainOverlay - Animated grain/noise texture overlay
 *
 * Creates a "breathing paper" effect with subtle scale animation.
 * Uses SVG feTurbulence filter for noise texture.
 *
 * @example
 * // Standalone usage
 * <GrainOverlay />
 *
 * // With custom opacity
 * <GrainOverlay opacity={0.08} />
 *
 * // With reduced motion respected
 * <GrainOverlay respectReducedMotion />
 */
export interface GrainOverlayProps {
  /** Opacity of the grain overlay (0-1). Default: 0.06 */
  opacity?: number;
  /** Whether to respect prefers-reduced-motion. Default: true */
  respectReducedMotion?: boolean;
  /** Animation duration in seconds. Default: 10 */
  duration?: number;
  /** Scale range - start value. Default: 1 */
  scaleFrom?: number;
  /** Scale range - end value. Default: 1.03 */
  scaleTo?: number;
  /** Additional CSS class names */
  className?: string;
  /** Z-index for stacking. Default: 9999 (--z-grain) */
  zIndex?: number;
}

export default function GrainOverlay({
  opacity = 0.06,
  respectReducedMotion = true,
  duration = 10,
  scaleFrom = 1,
  scaleTo = 1.03,
  className = '',
  zIndex = 9999,
}: GrainOverlayProps) {
  const { prefersReducedMotion } = useGrainAnimation({ respectReducedMotion });

  // SVG noise filter as data URL
  const noiseSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E`;

  // Animation variants for breathing effect
  const breathingVariants = {
    initial: {
      scale: scaleFrom,
      opacity: opacity,
    },
    animate: {
      scale: scaleTo,
      opacity: opacity,
    },
  };

  // Transition config - disabled when reduced motion is preferred
  const transition = prefersReducedMotion
    ? { type: false } as const
    : {
        duration: duration,
        ease: [0.45, 0, 0.55, 1] as [number, number, number, number],
        repeat: Infinity,
        repeatType: 'reverse' as const,
      };

  return (
    <motion.div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{
        zIndex,
        backgroundImage: `url("${noiseSvg}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
        mixBlendMode: 'multiply',
        willChange: 'transform',
      }}
      initial="initial"
      animate="animate"
      variants={breathingVariants}
      transition={transition}
      aria-hidden="true"
    />
  );
}
