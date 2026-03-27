import { useRef, type ReactNode, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  tiltSpeed?: number;
  springConfig?: {
    stiffness?: number;
    damping?: number;
  };
  shadowIntensity?: number;
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 15,
  tiltSpeed = 300,
  springConfig = { stiffness: 200, damping: 30 },
  shadowIntensity = 0.4,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isTouchDevice = useIsTouchDevice();
  const prefersReducedMotion = useReducedMotion();

  // Motion values for mouse position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring animations for smooth return
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]),
    springConfig
  );

  // Shadow transform values
  const shadowX = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-20, 20]),
    springConfig
  );
  const shadowY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [20, -20]),
    springConfig
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || isTouchDevice) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalize position to -0.5 to 0.5
      const normalizedX = (e.clientX - centerX) / (rect.width / tiltSpeed);
      const normalizedY = (e.clientY - centerY) / (rect.height / tiltSpeed);

      mouseX.set(Math.max(-0.5, Math.min(0.5, normalizedX)));
      mouseY.set(Math.max(-0.5, Math.min(0.5, normalizedY)));
    },
    [mouseX, mouseY, tiltSpeed, isTouchDevice]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Static presentation for touch devices or reduced-motion users
  if (isTouchDevice || prefersReducedMotion) {
    return (
      <div
        ref={cardRef}
        className={`cursor-pointer ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className={`cursor-pointer perspective-1000 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Card content layer */}
      <div
        className="relative"
        style={{ transform: 'translateZ(40px)' }}
      >
        {children}
      </div>

      {/* Shadow layer - moves with tilt for depth effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          x: shadowX,
          y: shadowY,
          filter: 'blur(28px)',
          opacity: shadowIntensity,
          background: 'radial-gradient(circle at 50% 50%, rgba(20, 12, 6, 0.45) 0%, transparent 65%)',
          transform: 'translateZ(-50px)',
          willChange: 'transform',
        }}
      />
    </motion.div>
  );
}
