import { useEffect, useState, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

interface ImpactCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

function AnimatedNumber({
  value,
  duration = 2000,
}: {
  value: number;
  duration: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration, prefersReducedMotion]);

  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
}

export default function ImpactCounter({
  value,
  label,
  prefix = '',
  suffix = '',
  duration = 2000,
  className = '',
}: ImpactCounterProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      className={`text-center ${className}`}
    >
      <div className="font-display text-h2 md:text-h1 font-bold text-ink leading-none tracking-tight">
        {prefix}
        <AnimatedNumber value={value} duration={duration} />
        {suffix}
      </div>
      <div className="font-body text-caption text-sepia-mid tracking-[0.15em] uppercase mt-3">
        {label}
      </div>
    </motion.div>
  );
}
