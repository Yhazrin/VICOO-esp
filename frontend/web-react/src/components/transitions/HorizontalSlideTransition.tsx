import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * HorizontalSlideTransition — Refined editorial-style page transition
 *
 * A subtle, confident horizontal slide that feels like turning a magazine page
 * rather than theatrical curtain. Respects prefers-reduced-motion.
 *
 * Direction: slides in from right on new pages, out to left.
 * The effect is understated yet sophisticated — bold enough to feel intentional,
 * conservative enough to never distract from content.
 */
export default function HorizontalSlideTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'idle' | 'entering' | 'entered' | 'exiting'>('idle');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Start exit animation
      setTransitionStage('exiting');

      const exitDuration = prefersReducedMotion ? 50 : 280;
      const exitTimer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('entering');

        const enterDuration = prefersReducedMotion ? 50 : 340;
        const enterTimer = setTimeout(() => {
          setTransitionStage('entered');
        }, enterDuration);

        return () => clearTimeout(enterTimer);
      }, exitDuration);

      return () => clearTimeout(exitTimer);
    }
  }, [location, displayLocation.pathname, prefersReducedMotion]);

  // Subtle horizontal slide variants — confident and understated
  const slideVariants = {
    idle: {
      x: 0,
      opacity: 1,
    },
    entering: {
      x: prefersReducedMotion ? 0 : 24,
      opacity: prefersReducedMotion ? 1 : 0,
    },
    entered: {
      x: 0,
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.34,
        ease: [0.22, 1, 0.36, 1], // refined ease-out, editorial feel
      },
    },
    exiting: {
      x: prefersReducedMotion ? 0 : -16,
      opacity: prefersReducedMotion ? 1 : 0.6,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.28,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  // Very subtle overlay wipes from left edge — like a gentle page edge passing
  const overlayVariants = {
    initial: { scaleX: 0, transformOrigin: 'left' },
    animate: {
      scaleX: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.18,
        ease: [0.4, 0, 0.6, 1],
      },
    },
    exit: {
      scaleX: 0,
      transformOrigin: 'right',
      transition: {
        duration: prefersReducedMotion ? 0 : 0.22,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={displayLocation.pathname}
          variants={slideVariants}
          initial={transitionStage === 'entering' ? 'entering' : 'idle'}
          animate={transitionStage === 'entered' || transitionStage === 'idle' ? 'entered' : 'entering'}
          exit="exiting"
          style={{ willChange: 'transform, opacity' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Subtle warm edge wipe — barely visible, adds depth */}
      <AnimatePresence>
        {transitionStage === 'entering' && (
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 z-50 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(139, 115, 85, 0.03) 0%, transparent 12%)',
            }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Exit edge — fades out as page leaves */}
      <AnimatePresence>
        {transitionStage === 'exiting' && (
          <motion.div
            variants={overlayVariants}
            initial={{ scaleX: 1, transformOrigin: 'right' }}
            animate={{ scaleX: 0, transformOrigin: 'right' }}
            exit={{ scaleX: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.22,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute inset-0 z-50 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 88%, rgba(139, 115, 85, 0.025) 100%)',
            }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
