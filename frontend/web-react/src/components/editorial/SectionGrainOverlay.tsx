import { type HTMLAttributes } from 'react';

interface SectionGrainOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** Base frequency of the noise pattern (default: 0.9) */
  frequency?: number;
  /** Number of octaves for noise complexity (default: 4) */
  octaves?: number;
  /** Opacity of the grain layer (default: 0.06) */
  opacity?: number;
}

export default function SectionGrainOverlay({
  frequency = 0.9,
  octaves = 4,
  opacity = 0.06,
  className = '',
  ...props
}: SectionGrainOverlayProps) {
  return (
    <div
      className={`absolute inset-0 z-0 pointer-events-none ${className}`}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='${octaves}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
