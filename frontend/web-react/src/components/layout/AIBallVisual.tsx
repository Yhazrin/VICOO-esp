import { useRef, useEffect, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* ────────────────────────────────────────────────────
   Style A — Orb (mini HeroInteractiveOrb)
   Concentric rotating rings + gradient core + particles
   ──────────────────────────────────────────────────── */
function OrbVisual({ isImpact }: { isImpact: boolean }) {
  const prefersReducedMotion = useReducedMotion();

  const ring1Color = isImpact ? 'rgba(190,93,46,0.35)' : 'rgba(139,58,42,0.25)';
  const ring2Color = isImpact ? 'rgba(196,164,90,0.4)' : 'rgba(196,164,90,0.3)';
  const ring3Color = isImpact ? 'rgba(92,77,61,0.45)' : 'rgba(92,77,61,0.35)';
  const coreGrad = isImpact
    ? 'linear-gradient(135deg, rgba(232,137,74,0.6) 0%, rgba(139,58,42,0.5) 50%, rgba(196,164,90,0.4) 100%)'
    : 'linear-gradient(135deg, rgba(139,58,42,0.45) 0%, rgba(92,77,61,0.35) 50%, rgba(196,164,90,0.25) 100%)';
  const glowColor = isImpact
    ? '0 0 12px rgba(232,137,74,0.4), 0 0 20px rgba(196,164,90,0.2)'
    : '0 0 12px rgba(139,58,42,0.3), 0 0 20px rgba(196,164,90,0.15)';

  return (
    <div className="absolute inset-0 overflow-hidden rounded-full" style={{ perspective: 200 }}>
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `1.5px solid ${ring1Color}`, transform: 'translateZ(-6px)' }}
        animate={prefersReducedMotion ? {} : { rotate: [0, 360] }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 12, repeat: Infinity, ease: 'linear' }}
      />
      {/* Middle ring */}
      <motion.div
        className="absolute inset-[3px] rounded-full"
        style={{ border: `1px solid ${ring2Color}`, transform: 'translateZ(-3px)' }}
        animate={prefersReducedMotion ? {} : { rotate: [0, -360] }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner ring */}
      <motion.div
        className="absolute inset-[6px] rounded-full"
        style={{ border: `1px solid ${ring3Color}`, transform: 'translateZ(-1px)' }}
        animate={prefersReducedMotion ? {} : { rotate: [0, 360] }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: 'linear' }}
      />
      {/* Core */}
      <motion.div
        className="absolute inset-[9px] rounded-full"
        style={{ background: coreGrad }}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.06, 1] }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Highlight */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '11px',
          background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.35) 0%, transparent 60%)',
          transform: 'translateZ(2px)',
          filter: 'blur(2px)',
        }}
      />
      {/* Particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            background: isImpact ? 'rgba(246,186,111,0.7)' : 'rgba(196,164,90,0.6)',
            left: `${25 + i * 18}%`,
            top: `${28 + (i % 2) * 20}%`,
            transform: 'translateZ(4px)',
          }}
          animate={prefersReducedMotion ? { opacity: 0.5 } : {
            y: [0, -6, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={prefersReducedMotion ? { duration: 0 } : {
            duration: 2.5 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: glowColor }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────
   Style B — Particles (Canvas-based particle planet)
   ──────────────────────────────────────────────────── */
function ParticlesVisual({ isImpact }: { isImpact: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 56;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const coreRadius = 14;

    const colors = isImpact
      ? ['rgba(232,137,74,', 'rgba(196,164,90,', 'rgba(246,186,111,', 'rgba(139,58,42,']
      : ['rgba(139,58,42,', 'rgba(196,164,90,', 'rgba(92,77,61,', 'rgba(168,90,74,'];

    interface Particle {
      angle: number;
      speed: number;
      orbitA: number;
      orbitB: number;
      size: number;
      color: string;
      phase: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 18; i++) {
      const orbit = coreRadius + 4 + Math.random() * 12;
      particles.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.015,
        orbitA: orbit,
        orbitB: orbit * (0.5 + Math.random() * 0.3),
        size: 1 + Math.random() * 2,
        color: colors[i % colors.length],
        phase: Math.random() * Math.PI * 2,
      });
    }

    let raf: number;
    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // Core glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius + 6);
      if (isImpact) {
        grad.addColorStop(0, 'rgba(232,137,74,0.5)');
        grad.addColorStop(0.6, 'rgba(139,58,42,0.35)');
        grad.addColorStop(1, 'rgba(196,164,90,0)');
      } else {
        grad.addColorStop(0, 'rgba(139,58,42,0.4)');
        grad.addColorStop(0.6, 'rgba(92,77,61,0.25)');
        grad.addColorStop(1, 'rgba(196,164,90,0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius + 6, 0, Math.PI * 2);
      ctx.fill();

      // Core solid
      const coreGrad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, coreRadius);
      if (isImpact) {
        coreGrad.addColorStop(0, 'rgba(246,186,111,0.8)');
        coreGrad.addColorStop(0.5, 'rgba(232,137,74,0.6)');
        coreGrad.addColorStop(1, 'rgba(139,58,42,0.4)');
      } else {
        coreGrad.addColorStop(0, 'rgba(196,164,90,0.6)');
        coreGrad.addColorStop(0.5, 'rgba(139,58,42,0.45)');
        coreGrad.addColorStop(1, 'rgba(92,77,61,0.3)');
      }
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Particles
      const t = Date.now() * 0.001;
      for (const p of particles) {
        p.angle += prefersReducedMotion ? 0 : p.speed;
        const wobble = Math.sin(t * 2 + p.phase) * 1.5;
        const px = cx + Math.cos(p.angle) * p.orbitA;
        const py = cy + Math.sin(p.angle) * p.orbitB + wobble;
        const alpha = 0.4 + 0.4 * Math.sin(t + p.phase);

        ctx.fillStyle = `${p.color}${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer glow ring
      ctx.strokeStyle = isImpact ? 'rgba(232,137,74,0.2)' : 'rgba(139,58,42,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius + 10, 0, Math.PI * 2);
      ctx.stroke();

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [isImpact, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 rounded-full"
      style={{ width: 56, height: 56 }}
    />
  );
}

/* ────────────────────────────────────────────────────
   Exported component
   ──────────────────────────────────────────────────── */
export interface AIBallVisualProps {
  style: 'orb' | 'particles';
  isImpact: boolean;
}

const AIBallVisual = memo(function AIBallVisual({ style, isImpact }: AIBallVisualProps) {
  return style === 'particles' ? <ParticlesVisual isImpact={isImpact} /> : <OrbVisual isImpact={isImpact} />;
});

export default AIBallVisual;
