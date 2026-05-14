/**
 * GrainOverlay — CSS-only grain/noise texture overlay
 *
 * Uses CSS @keyframes for the breathing effect instead of framer-motion,
 * eliminating JS animation overhead and reducing GPU compositing cost.
 */
export interface GrainOverlayProps {
  /** Opacity of the grain overlay (0-1). Default: 0.06 */
  opacity?: number;
  /** Whether to respect prefers-reduced-motion. Default: true */
  respectReducedMotion?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Z-index for stacking. Default: 9999 */
  zIndex?: number;
}

export default function GrainOverlay({
  opacity = 0.06,
  className = '',
  zIndex = 9999,
}: GrainOverlayProps) {
  // SVG noise filter as data URL
  const noiseSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E`;

  return (
    <div
      className={`grain-overlay fixed inset-0 pointer-events-none ${className}`}
      style={{
        zIndex,
        backgroundImage: `url("${noiseSvg}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
        mixBlendMode: 'multiply',
        opacity,
      }}
      aria-hidden="true"
    />
  );
}
