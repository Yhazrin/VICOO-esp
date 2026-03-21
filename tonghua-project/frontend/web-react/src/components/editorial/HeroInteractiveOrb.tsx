'use client';
import { useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function HeroInteractiveOrb() {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const isTouchDevice = useMediaQuery('(hover: none)');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || isTouchDevice) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateYVal = ((e.clientX - centerX) / (rect.width / 2)) * 20;
    const rotateXVal = ((e.clientY - centerY) / (rect.height / 2)) * -20;
    rotateX.set(rotateXVal);
    rotateY.set(rotateYVal);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  if (isTouchDevice) {
    return null;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      animate={{ rotateX: 0, rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="absolute right-0 top-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] hidden lg:block cursor-pointer"
      aria-hidden="true"
    >
      {/* Outermost ring - slowest rotation */}
      <motion.div
        className="absolute inset-0 rounded-full border border-rust/20"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        style={{ transform: 'translateZ(-30px)' }}
      />

      {/* Second ring */}
      <motion.div
        className="absolute inset-4 rounded-full border border-pale-gold/30"
        animate={{ rotate: [0, -360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ transform: 'translateZ(-20px)' }}
      />

      {/* Third ring */}
      <motion.div
        className="absolute inset-8 rounded-full border border-sepia-mid/40"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transform: 'translateZ(-10px)' }}
      />

      {/* Core orb - gradient filled */}
      <motion.div
        className="absolute inset-12 rounded-full bg-gradient-to-br from-rust/40 via-archive-brown/30 to-pale-gold/20"
        animate={{
          scale: [1, 1.05, 1],
          background: [
            'linear-gradient(135deg, rgba(139,58,42,0.4) 0%, rgba(92,77,61,0.3) 50%, rgba(212,175,128,0.2) 100%)',
            'linear-gradient(135deg, rgba(139,58,42,0.5) 0%, rgba(92,77,61,0.4) 50%, rgba(212,175,128,0.3) 100%)',
            'linear-gradient(135deg, rgba(139,58,42,0.4) 0%, rgba(92,77,61,0.3) 50%, rgba(212,175,128,0.2) 100%)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Inner highlight orb */}
      <motion.div
        className="absolute inset-16 rounded-full bg-gradient-to-tr from-paper/60 to-transparent"
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          transform: 'translateZ(10px) translateX(-20%) translateY(-20%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-pale-gold/60"
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
          style={{
            left: `${20 + i * 12}%`,
            top: `${30 + (i % 3) * 15}%`,
            transform: 'translateZ(20px)',
          }}
        />
      ))}

      {/* Central glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: '0 0 80px rgba(139, 58, 42, 0.3), 0 0 120px rgba(212, 175, 128, 0.15)',
          transform: 'translateZ(5px)',
        }}
      />
    </motion.div>
  );
}
