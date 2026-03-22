import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  initialRotate?: number;
  delay?: number;
  x?: string;
}

interface HeroFloatingCardsProps {
  className?: string;
}

function FloatingCard({
  children,
  className = '',
  initialRotate = 0,
  delay = 0.3,
  x = '50px',
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseXNorm = (e.clientX - centerX) / (rect.width / 2);
    const mouseYNorm = (e.clientY - centerY) / (rect.height / 2);
    mouseX.set(mouseXNorm);
    mouseY.set(mouseYNorm);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x } })}
      animate={{ opacity: 1, x: 0, rotate: initialRotate }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`absolute cursor-pointer ${className}`}
    >
      <motion.div
        className="relative"
        style={{ transform: 'translateZ(20px)' }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function HeroFloatingCards({ className = '' }: HeroFloatingCardsProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className={`absolute right-0 top-0 bottom-0 w-[44%] z-[4] ${className}`}>
      {/* Card 1 - Child Drawing */}
      <FloatingCard
        className="w-[130px] h-[160px] top-[60px] right-[220px]"
        initialRotate={-4}
        delay={0.3}
        x="50px"
      >
        <div className="bg-[#EDE9DF] rounded-md border border-black/5 overflow-hidden flex flex-col shadow-lg shadow-black/5">
          <svg viewBox="0 0 130 130" width="100%" style={{ flex: 1 }} xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="110" height="110" fill="#F4F0E8" rx="3"/>
            <circle cx="45" cy="50" r="18" fill="#B84B2A" opacity="0.5"/>
            <circle cx="78" cy="42" r="12" fill="#E8C5A0" opacity="0.7"/>
            <path d="M20 80 Q40 65 60 78 Q80 90 110 72" stroke="#7BAE7F" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M25 95 Q55 85 85 95 Q100 100 115 90" stroke="#D4A87C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <rect x="15" y="105" width="40" height="8" rx="2" fill="#E8C5A0" opacity="0.5"/>
            <rect x="60" y="108" width="55" height="5" rx="2" fill="#B0C9A8" opacity="0.4"/>
          </svg>
          <div className="font-mono text-[8px] tracking-widest text-gray-400 text-center py-2 border-t border-black/[0.06] bg-paper/70 w-full">
            CHILD DRAWING · AGE 8
          </div>
        </div>
      </FloatingCard>

      {/* Arrow Sketch */}
      <motion.svg
        {...(prefersReducedMotion ? {} : { initial: { opacity: 0 } })}
        animate={{ opacity: 0.6 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.6 }}
        className="absolute z-[6] w-12 h-8 top-[185px] right-[178px]"
        viewBox="0 0 48 32"
        aria-hidden="true"
      >
        <path
          d="M4 16 Q16 6 36 14 L30 10 M36 14 L31 20"
          stroke="#B84B2A"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
          strokeDasharray="2,2"
        />
      </motion.svg>

      {/* Card 2 - T-Shirt */}
      <FloatingCard
        className="w-[110px] h-[148px] top-[160px] right-[80px]"
        initialRotate={3}
        delay={0.4}
        x="50px"
      >
        <div className="bg-[#EDE9DF] rounded-md border border-black/5 overflow-hidden flex flex-col shadow-lg shadow-black/5">
          <svg viewBox="0 0 110 120" width="100%" style={{ flex: 1 }} xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="94" height="104" fill="#EDE9DF" rx="3"/>
            <path d="M20 28 Q30 15 40 22 L55 18 L70 22 Q80 15 90 28" stroke="#888" strokeWidth="1.2" fill="none"/>
            <rect x="20" y="28" width="70" height="75" fill="#D4C5B0" opacity="0.4" rx="2"/>
            <circle cx="42" cy="55" r="10" fill="#B84B2A" opacity="0.45"/>
            <path d="M35 68 Q55 60 72 70" stroke="#7BAE7F" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <rect x="28" y="80" width="15" height="15" rx="2" fill="#E8C5A0" opacity="0.6"/>
            <rect x="47" y="82" width="15" height="12" rx="2" fill="#B0C9A8" opacity="0.5"/>
            <rect x="66" y="80" width="18" height="15" rx="2" fill="#D4A87C" opacity="0.5"/>
          </svg>
          <div className="font-mono text-[8px] tracking-widest text-gray-400 text-center py-2 border-t border-black/[0.06] bg-paper/70 w-full">
            TSHIRT · ¥188
          </div>
        </div>
      </FloatingCard>

      {/* Card 3 - Hoodie (largest, tilted more) */}
      <FloatingCard
        className="w-[145px] h-[170px] top-[50px] right-[50px]"
        initialRotate={5}
        delay={0.5}
        x="50px"
      >
        <div className="bg-[#F0ECE2] rounded-md border border-black/5 overflow-hidden flex flex-col shadow-lg shadow-black/5">
          <svg viewBox="0 0 145 140" width="100%" style={{ flex: 1 }} xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="129" height="124" fill="#F0ECE2" rx="3"/>
            <path d="M25 45 Q40 20 72 30 Q104 20 120 45" stroke="#B84B2A" strokeWidth="1.5" fill="none" opacity="0.5"/>
            <ellipse cx="72" cy="65" rx="22" ry="14" fill="#E8C5A0" opacity="0.55"/>
            <path d="M30 85 Q55 74 80 82 Q100 88 120 78" stroke="#7BAE7F" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
            <path d="M40 98 Q65 90 90 100 Q108 106 125 96" stroke="#D4A87C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <circle cx="35" cy="55" r="7" fill="#B84B2A" opacity="0.3"/>
            <circle cx="110" cy="52" r="5" fill="#7BAE7F" opacity="0.4"/>
            <path d="M55 110 L60 120 M72 112 L72 122 M88 110 L83 120" stroke="#999" strokeWidth="1" opacity="0.3"/>
          </svg>
          <div className="font-mono text-[8px] tracking-widest text-gray-400 text-center py-2 border-t border-black/[0.06] bg-paper/70 w-full">
            HOODIE · ¥298
          </div>
        </div>
      </FloatingCard>

      {/* Card 4 - Bag */}
      <FloatingCard
        className="w-[105px] h-[130px] top-[310px] right-[180px]"
        initialRotate={-2}
        delay={0.6}
        x="50px"
      >
        <div className="bg-[#EDE9DF] rounded-md border border-black/5 overflow-hidden flex flex-col shadow-lg shadow-black/5">
          <svg viewBox="0 0 105 108" width="100%" style={{ flex: 1 }} xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="89" height="92" fill="#EDE9DF" rx="3"/>
            <path d="M20 35 Q52 20 85 35 L82 90 L23 90 Z" fill="#C8B89A" opacity="0.35"/>
            <circle cx="52" cy="52" r="14" fill="none" stroke="#B84B2A" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="52" cy="52" r="6" fill="#B84B2A" opacity="0.4"/>
            <path d="M25 72 Q52 62 80 72" stroke="#7BAE7F" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <rect x="18" y="80" width="70" height="6" rx="2" fill="#E8C5A0" opacity="0.4"/>
          </svg>
          <div className="font-mono text-[8px] tracking-widest text-gray-400 text-center py-2 border-t border-black/[0.06] bg-paper/70 w-full">
            BAG · ¥228
          </div>
        </div>
      </FloatingCard>

      {/* Organic Badge Circle */}
      <motion.div
        {...(prefersReducedMotion ? {} : { initial: { opacity: 0, scale: 0.8 } })}
        animate={{ opacity: 1, scale: 1, rotate: -8 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.7 }}
        className="absolute bottom-[80px] right-[60px] w-20 h-20 rounded-full border border-black/10 bg-paper/90 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-lg shadow-black/5"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.1, rotate: 0 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3L14 9H20L15.5 12.5L17.5 18.5L12 15L6.5 18.5L8.5 12.5L4 9H10L12 3Z" fill="#B84B2A" opacity="0.55"/>
        </svg>
        <span className="font-mono text-[7px] tracking-wider text-gray-500 text-center leading-[1.4]">
          100%<br/>ORGANIC
        </span>
      </motion.div>
    </div>
  );
}
