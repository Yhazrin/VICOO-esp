import { type ReactNode, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform, useSpring, motionValue } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface HorizontalScrollTransitionProps {
  children: ReactNode;
}

const springConfig = { stiffness: 300, damping: 30, mass: 0.5 };

export default function HorizontalScrollTransition({ children }: HorizontalScrollTransitionProps) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  // Track mouse position for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Direction-aware animation: slide from right on enter, slide to left on exit
  const slideVariants = {
    initial: {
      opacity: 0,
      x: 60,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        ...springConfig,
      },
    },
    exit: {
      opacity: 0,
      x: -60,
      scale: 0.98,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  // Parallax layers for depth effect
  const parallaxVariants = {
    animate: {
      x: (mousePosition.x - 0.5) * -20,
      y: (mousePosition.y - 0.5) * -10,
    },
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Background decorative layer with parallax */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        variants={parallaxVariants}
        animate="animate"
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '150px 150px',
          }}
        />
      </motion.div>

      {/* Progress indicator line */}
      <motion.div
        className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-rust/40 to-transparent"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        key={location.pathname}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Main content with animations */}
      <AnimatePresence mode="wait" initial={false">
        <motion.div
          key={location.pathname}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10"
        >
          {/* Parallax floating elements */}
          <motion.div
            className="absolute -top-20 -right-20 w-64 h-64 pointer-events-none opacity-5"
            animate={{
              x: (mousePosition.x - 0.5) * 30,
              y: (mousePosition.y - 0.5) * 30,
              rotate: (mousePosition.x - 0.5) * 10,
            }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          >
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" className="text-rust" />
              <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5" className="text-rust" />
              <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" className="text-rust" />
            </svg>
          </motion.div>

          <motion.div
            className="absolute -bottom-10 -left-10 w-48 h-48 pointer-events-none opacity-5"
            animate={{
              x: (mousePosition.x - 0.5) * -20,
              y: (mousePosition.y - 0.5) * -20,
              rotate: (mousePosition.y - 0.5) * -8,
            }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          >
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
              <rect x="10" y="10" width="80" height="80" stroke="currentColor" strokeWidth="0.5" className="text-sepia-mid" transform="rotate(15 50 50)" />
              <rect x="20" y="20" width="60" height="60" stroke="currentColor" strokeWidth="0.5" className="text-sepia-mid" transform="rotate(30 50 50)" />
            </svg>
          </motion.div>

          {/* Content */}
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Corner unfold accent */}
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={`corner-${location.pathname}`}
      >
        <motion.div
          className="absolute top-0 right-0 w-full h-full"
          initial={{ scale: 0, originX: '100%', originY: '0%' }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full text-rust/10" fill="none">
            <path d="M100 0 L100 100 L0 0 Z" fill="currentColor" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Bottom corner unfold */}
      <motion.div
        className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={`corner-bottom-${location.pathname}`}
      >
        <motion.div
          className="absolute bottom-0 left-0 w-full h-full"
          initial={{ scale: 0, originX: '0%', originY: '100%' }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full text-rust/5" fill="none">
            <path d="M0 100 L100 100 L0 0 Z" fill="currentColor" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
