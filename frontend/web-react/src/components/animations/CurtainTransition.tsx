import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface CurtainTransitionProps {
  children: React.ReactNode;
}

/**
 * Curtain page transition with warm editorial aesthetic.
 * Two sepia/warm-toned panels meet at center, then open outward on route change.
 * Respects prefers-reduced-motion for accessibility.
 */
export default function CurtainTransition({ children }: CurtainTransitionProps) {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Trigger curtain animation on location change
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Curtain animation variants - scaleX from center outward
  const curtainVariants = {
    initial: {
      scaleX: prefersReducedMotion ? 0 : 1,
      originX: 0.5,
    },
    animate: {
      scaleX: 0,
      originX: 0.5,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.6,
        ease: [0.43, 0.13, 0.23, 0.96], // editorial ease-out
      },
    },
    exit: {
      scaleX: 0,
      originX: 0.5,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.01,
      },
    },
  };

  // Content animation - fade in after curtain opens
  const contentVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.4,
        delay: prefersReducedMotion ? 0.01 : 0.5,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.2,
      },
    },
  };

  return (
    <div className="relative overflow-hidden">
      {/* Page content with fade animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Curtain overlay - only visible during animation */}
      <AnimatePresence>
        {isAnimating && (
          <>
            {/* Left curtain panel */}
            <motion.div
              variants={curtainVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 z-50 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, var(--color-sepia-dark, #8B7355) 0%, var(--color-sepia-mid, #A69076) 50%, var(--color-sepia-light, #C4A882) 100%)',
              }}
              aria-hidden="true"
            />

            {/* Right curtain panel */}
            <motion.div
              variants={curtainVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 z-50 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, var(--color-sepia-light, #C4A882) 50%, var(--color-sepia-mid, #A69076) 100%, var(--color-sepia-dark, #8B7355) 100%)',
              }}
              aria-hidden="true"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
