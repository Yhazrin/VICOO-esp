import { useRef, useCallback, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  disabled?: boolean;
}

/**
 * MagneticButton - A button with cursor-following attraction effect
 *
 * Uses framer-motion's useMotionValue and useSpring for performance.
 * No useState involved - all animations are driven by motion values.
 * Falls back to normal rendering on touch devices.
 */
export default function MagneticButton({
  children,
  className = '',
  strength = 0.3,
  disabled = false,
}: MagneticButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isTouchDevice = useMediaQuery('(hover: none)');
  const prefersReducedMotion = useReducedMotion();

  // Motion values for x and y displacement
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring config for smooth return animation
  const springConfig = {
    type: 'spring' as const,
    stiffness: 150,
    damping: 15,
    mass: 0.1,
  };

  // Apply spring physics to smooth out the motion
  // Multiply by max displacement based on strength
  const maxDisplacement = 10 * strength;
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || isTouchDevice || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate cursor position relative to button center (-0.5 to 0.5)
      const relativeX = (e.clientX - centerX) / rect.width;
      const relativeY = (e.clientY - centerY) / rect.height;

      // Apply the max displacement multiplier
      mouseX.set(relativeX * maxDisplacement);
      mouseY.set(relativeY * maxDisplacement);
    },
    [disabled, isTouchDevice, mouseX, mouseY, maxDisplacement]
  );

  const handleMouseLeave = useCallback(() => {
    if (disabled || isTouchDevice) return;
    mouseX.set(0);
    mouseY.set(0);
  }, [disabled, isTouchDevice, mouseX, mouseY]);

  // Touch devices or reduced motion: render without magnetic effect
  if (isTouchDevice || prefersReducedMotion) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        transition={springConfig}
        style={{
          display: 'inline-block',
          x,
          y,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
