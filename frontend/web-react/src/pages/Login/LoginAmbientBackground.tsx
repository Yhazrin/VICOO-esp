import { memo } from 'react';
import {
  AnimatePresence,
  motion,
  type MotionValue,
  useTransform,
} from 'framer-motion';
import type { AmbientMode } from './loginAmbientTypes';

const AMBIENT_COLORS: Record<Exclude<AmbientMode, null>, string> = {
  email: 'rgba(230,0,18,0.12)',
  password: 'rgba(109,137,116,0.14)',
  accounts: 'rgba(196,164,90,0.16)',
  action: 'rgba(36,36,36,0.12)',
};

const RHYTHM_LINES = [
  { offset: 0.12, opacity: 0.07, drift: 22 },
  { offset: 0.38, opacity: 0.05, drift: 14 },
  { offset: 0.62, opacity: 0.06, drift: 18 },
  { offset: 0.84, opacity: 0.04, drift: 10 },
] as const;

interface LoginAmbientBackgroundProps {
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
  grainDriftX: MotionValue<number>;
  grainDriftY: MotionValue<number>;
  orbPrimaryX: MotionValue<number>;
  orbPrimaryY: MotionValue<number>;
  orbSecondaryX: MotionValue<number>;
  orbSecondaryY: MotionValue<number>;
  ambientMode: AmbientMode;
  ambientPulse: number;
  prefersReducedMotion: boolean | null;
}

function LoginAmbientBackground({
  smoothX,
  smoothY,
  grainDriftX,
  grainDriftY,
  orbPrimaryX,
  orbPrimaryY,
  orbSecondaryX,
  orbSecondaryY,
  ambientMode,
  ambientPulse,
  prefersReducedMotion,
}: LoginAmbientBackgroundProps) {
  const spotlightX = useTransform(smoothX, [0, 1], ['18%', '82%']);
  const spotlightY = useTransform(smoothY, [0, 1], ['12%', '88%']);
  const lineShift = useTransform(smoothX, [0, 1], [-28, 28]);
  const vignetteShift = useTransform(smoothY, [0, 1], [-8, 8]);

  const focusBiasY =
    ambientMode === 'email' ? -24 : ambientMode === 'password' ? 18 : ambientMode === 'accounts' ? -8 : 0;

  const reduced = Boolean(prefersReducedMotion);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Mouse-follow soft spotlight */}
      {!reduced && (
        <motion.div
          className="absolute h-[min(72vh,640px)] w-[min(72vh,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: spotlightX,
            top: spotlightY,
            background:
              'radial-gradient(circle at 50% 50%, rgba(255,252,248,0.55) 0%, rgba(255,252,248,0.08) 42%, transparent 68%)',
          }}
        />
      )}

      {/* Editorial rhythm lines — parallax drift */}
      {!reduced &&
        RHYTHM_LINES.map((line, index) => (
          <motion.div
            key={line.offset}
            className="absolute left-[-8%] right-[-8%] h-px bg-gradient-to-r from-transparent via-ink/25 to-transparent"
            style={{
              top: `${line.offset * 100}%`,
              opacity: line.opacity,
              x: lineShift,
            }}
            animate={{
              scaleX: ambientMode ? [1, 1.04, 1] : [1, 1.015, 1],
            }}
            transition={{
              duration: ambientMode ? 1.6 : 4.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.22,
            }}
          />
        ))}

      {/* Film grain */}
      <motion.div
        className="absolute inset-[-4%] opacity-[0.028]"
        style={{
          x: grainDriftX,
          y: grainDriftY,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        animate={reduced ? undefined : { opacity: [0.022, 0.034, 0.022] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Color orbs — pointer parallax + idle breath */}
      <motion.div
        className="absolute right-[-10%] top-[-18%] h-[600px] w-[600px] rounded-full bg-rust/[0.045] blur-3xl"
        style={{ x: orbPrimaryX, y: orbPrimaryY }}
        animate={
          reduced
            ? undefined
            : {
                scale: ambientMode === 'email' ? 1.08 : ambientMode === 'action' ? 1.03 : [1, 1.025, 1],
                opacity: ambientMode === 'email' ? 0.95 : [0.68, 0.76, 0.68],
              }
        }
        transition={
          ambientMode === 'email' || ambientMode === 'action'
            ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            : { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <motion.div
        className="absolute bottom-[-18%] left-[-10%] h-[520px] w-[520px] rounded-full bg-sage/[0.05] blur-3xl"
        style={{ x: orbSecondaryX, y: orbSecondaryY }}
        animate={
          reduced
            ? undefined
            : {
                scale: ambientMode === 'password' ? 1.09 : ambientMode === 'action' ? 1.03 : [1, 1.02, 1],
                opacity: ambientMode === 'password' ? 0.96 : [0.66, 0.74, 0.66],
              }
        }
        transition={
          ambientMode === 'password' || ambientMode === 'action'
            ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            : { duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }
        }
      />

      {/* Center wash — shifts with focus context */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        animate={
          reduced
            ? { opacity: ambientMode ? 1 : 0.62, y: focusBiasY }
            : {
                y: focusBiasY,
                opacity: ambientMode ? [0.88, 1, 0.88] : [0.55, 0.68, 0.55],
                scale: ambientMode ? [1.02, 1.05, 1.02] : [0.97, 1, 0.97],
              }
        }
        transition={
          ambientMode
            ? { y: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }
            : { duration: 5, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{
          background: ambientMode
            ? `radial-gradient(circle at 50% 50%, ${AMBIENT_COLORS[ambientMode]} 0%, rgba(255,255,255,0) 68%)`
            : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 70%)',
        }}
      />

      {/* Interaction ripples */}
      <AnimatePresence mode="popLayout">
        {ambientPulse > 0 && ambientMode && (
          <>
            <motion.div
              key={`ring-a-${ambientPulse}`}
              className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{ borderColor: AMBIENT_COLORS[ambientMode] }}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 0.28, scale: 1.06 }}
              exit={{ opacity: 0, scale: 1.22 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              key={`ring-b-${ambientPulse}`}
              className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
              style={{ borderColor: AMBIENT_COLORS[ambientMode] }}
              initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
              animate={{ opacity: 0.18, scale: 1.12, rotate: 6 }}
              exit={{ opacity: 0, scale: 1.26, rotate: 12 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Corner vignette — subtle vertical sway */}
      <motion.div
        className="absolute inset-0"
        style={{ y: vignetteShift }}
        animate={
          reduced
            ? undefined
            : {
                background: [
                  'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(26,26,22,0.04) 100%)',
                  'radial-gradient(ellipse 82% 72% at 50% 48%, transparent 38%, rgba(26,26,22,0.05) 100%)',
                  'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(26,26,22,0.04) 100%)',
                ],
              }
        }
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export default memo(LoginAmbientBackground);
