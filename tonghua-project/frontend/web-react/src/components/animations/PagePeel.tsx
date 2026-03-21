import { type ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface PagePeelProps {
  children: ReactNode;
  /**
   * Corner to peel from: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
   * @default 'bottom-right'
   */
  corner?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /**
   * Maximum rotation angle in degrees
   * @default 15
   */
  maxRotation?: number;
  /**
   * Shadow intensity (0-1)
   * @default 0.3
   */
  shadowIntensity?: number;
  /**
   * ClassName for the container
   */
  className?: string;
}

/**
 * PagePeel - A magazine-style page curl/peel animation component
 *
 * Creates a 3D page corner that "lifts" as if turning a magazine page,
 * revealing content beneath with realistic shadows.
 *
 * @example
 * ```tsx
 * <PagePeel corner="bottom-right">
 *   <div>Content to reveal</div>
 * </PagePeel>
 * ```
 */
export default function PagePeel({
  children,
  corner = 'bottom-right',
  maxRotation = 15,
  shadowIntensity = 0.3,
  className = '',
}: PagePeelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Skip all scroll-linked motion for reduced-motion users
  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="bg-paper">{children}</div>
      </div>
    );
  }

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Map scroll progress to rotation and transform based on corner
  const getTransforms = () => {
    switch (corner) {
      case 'bottom-right':
        return {
          rotateX: useTransform(scrollYProgress, [0, 0.5], [maxRotation, 0]),
          rotateY: useTransform(scrollYProgress, [0, 0.5], [-maxRotation, 0]),
          translateX: useTransform(scrollYProgress, [0, 0.5], [20, 0]),
          translateY: useTransform(scrollYProgress, [0, 0.5], [10, 0]),
          transformOrigin: 'right bottom',
          shadowX: 15,
          shadowY: 15,
          shadowBlur: 25,
        };
      case 'bottom-left':
        return {
          rotateX: useTransform(scrollYProgress, [0, 0.5], [maxRotation, 0]),
          rotateY: useTransform(scrollYProgress, [0, 0.5], [maxRotation, 0]),
          translateX: useTransform(scrollYProgress, [0, 0.5], [-20, 0]),
          translateY: useTransform(scrollYProgress, [0, 0.5], [10, 0]),
          transformOrigin: 'left bottom',
          shadowX: -15,
          shadowY: 15,
          shadowBlur: 25,
        };
      case 'top-right':
        return {
          rotateX: useTransform(scrollYProgress, [0, 0.5], [-maxRotation, 0]),
          rotateY: useTransform(scrollYProgress, [0, 0.5], [-maxRotation, 0]),
          translateX: useTransform(scrollYProgress, [0, 0.5], [20, 0]),
          translateY: useTransform(scrollYProgress, [0, 0.5], [-10, 0]),
          transformOrigin: 'right top',
          shadowX: 15,
          shadowY: -15,
          shadowBlur: 25,
        };
      case 'top-left':
        return {
          rotateX: useTransform(scrollYProgress, [0, 0.5], [-maxRotation, 0]),
          rotateY: useTransform(scrollYProgress, [0, 0.5], [maxRotation, 0]),
          translateX: useTransform(scrollYProgress, [0, 0.5], [-20, 0]),
          translateY: useTransform(scrollYProgress, [0, 0.5], [-10, 0]),
          transformOrigin: 'left top',
          shadowX: -15,
          shadowY: -15,
          shadowBlur: 25,
        };
    }
  };

  const transforms = getTransforms();

  // Shadow opacity follows inverse of rotation
  const shadowOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.5],
    [shadowIntensity, shadowIntensity * 0.5, 0]
  );

  // Peek amount - how much content is visible under the peel
  const peekOpacity = useTransform(scrollYProgress, [0, 0.4, 0.5], [0, 0.3, 0]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ perspective: '1200px' }}
    >
      {/* Base content layer (underneath the peel) */}
      <motion.div
        className="relative z-0"
        style={{ opacity: peekOpacity }}
      >
        {/* Subtle hint that there's more content */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 50%, rgba(139, 58, 42, 0.05) 100%)',
          }}
        />
      </motion.div>

      {/* Main content with 3D peel transform */}
      <motion.div
        className="relative z-10 will-change-transform"
        style={{
          rotateX: transforms.rotateX,
          rotateY: transforms.rotateY,
          translateX: transforms.translateX,
          translateY: transforms.translateY,
          transformOrigin: transforms.transformOrigin,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Shadow beneath the peel */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: shadowOpacity,
            transform: `translateX(${transforms.shadowX}px) translateY(${transforms.shadowY}px)`,
            transformOrigin: transforms.transformOrigin,
            background: `radial-gradient(ellipse at ${corner.replace('-', ' ')}, rgba(26, 26, 22, 0.4) 0%, transparent 70%)`,
            filter: `blur(${transforms.shadowBlur}px)`,
            zIndex: -1,
          }}
        />

        {/* Inner shadow for depth */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: shadowOpacity,
            boxShadow: `inset 0 0 60px rgba(26, 26, 22, ${shadowIntensity * 0.3})`,
            transform: 'translateZ(-1px)',
          }}
        />

        {/* Content */}
        <div className="bg-paper">
          {children}
        </div>
      </motion.div>

      {/* Peel corner accent - decorative fold line */}
      <motion.div
        className="absolute pointer-events-none z-20"
        style={{
          opacity: useTransform(scrollYProgress, [0, 0.3, 0.5], [0.6, 0.3, 0]),
        }}
      >
        {corner === 'bottom-right' && (
          <svg
            className="absolute bottom-0 right-0"
            style={{ width: 80, height: 80, transform: 'rotate(90deg)' }}
            viewBox="0 0 80 80"
            aria-hidden="true"
          >
            <path
              d="M0 80 Q0 0 80 0"
              fill="none"
              stroke="rgba(139, 58, 42, 0.2)"
              strokeWidth="1"
            />
          </svg>
        )}
        {corner === 'bottom-left' && (
          <svg
            className="absolute bottom-0 left-0"
            style={{ width: 80, height: 80, transform: 'rotate(0deg)' }}
            viewBox="0 0 80 80"
            aria-hidden="true"
          >
            <path
              d="M0 80 Q0 0 80 0"
              fill="none"
              stroke="rgba(139, 58, 42, 0.2)"
              strokeWidth="1"
            />
          </svg>
        )}
        {corner === 'top-right' && (
          <svg
            className="absolute top-0 right-0"
            style={{ width: 80, height: 80, transform: 'rotate(180deg)' }}
            viewBox="0 0 80 80"
            aria-hidden="true"
          >
            <path
              d="M0 80 Q0 0 80 0"
              fill="none"
              stroke="rgba(139, 58, 42, 0.2)"
              strokeWidth="1"
            />
          </svg>
        )}
        {corner === 'top-left' && (
          <svg
            className="absolute top-0 left-0"
            style={{ width: 80, height: 80, transform: 'rotate(270deg)' }}
            viewBox="0 0 80 80"
            aria-hidden="true"
          >
            <path
              d="M0 80 Q0 0 80 0"
              fill="none"
              stroke="rgba(139, 58, 42, 0.2)"
              strokeWidth="1"
            />
          </svg>
        )}
      </motion.div>
    </div>
  );
}
