/**
 * OrigamiFold.tsx
 * Origami-inspired 3D paper fold effects for section dividers and decorative elements
 *
 * Design: 1990s editorial magazine aesthetic - paper, sepia, tactile feel
 * Uses pure CSS 3D transforms (no Three.js)
 */

import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────
   OrigamiCorner — Decorative folded paper corner effect
   ───────────────────────────────────────────────────────────── */

export interface OrigamiCornerProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
  color?: 'paper' | 'aged' | 'sepia';
  showBackside?: boolean;
  className?: string;
}

const cornerPositionClasses = {
  'top-left': 'top-0 left-0 origin-top-left',
  'top-right': 'top-0 right-0 origin-top-right',
  'bottom-left': 'bottom-0 left-0 origin-bottom-left',
  'bottom-right': 'bottom-0 right-0 origin-bottom-right',
};

const cornerSizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const cornerColorClasses = {
  paper: {
    front: 'bg-paper',
    back: 'bg-aged-stock',
    shadow: 'rgba(26, 26, 22, 0.08)',
  },
  aged: {
    front: 'bg-aged-stock',
    back: 'bg-warm-gray',
    shadow: 'rgba(26, 26, 22, 0.12)',
  },
  sepia: {
    front: 'bg-sepia-mid',
    back: 'bg-archive-brown',
    shadow: 'rgba(26, 26, 22, 0.15)',
  },
};

export function OrigamiCorner({
  position = 'top-right',
  size = 'md',
  color = 'paper',
  showBackside = true,
  className = '',
}: OrigamiCornerProps) {
  const colors = cornerColorClasses[color];
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`relative ${cornerPositionClasses[position]} ${cornerSizeClasses[size]} ${className}`}
      style={{ perspective: '200px' }}
      aria-hidden="true"
    >
      {/* Base layer (untouched paper) */}
      <div
        className={`absolute inset-0 ${colors.front}`}
      />

      {/* Folded corner triangle */}
      <motion.div
        initial={prefersReducedMotion ? undefined : { rotate: 0, opacity: 0 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { rotate: -180, opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className={`
          absolute
          ${position === 'top-left' || position === 'bottom-right' ? 'top-0 right-0' : 'top-0 left-0'}
          ${position === 'top-left' || position === 'top-right' ? 'bottom-0' : 'top-0'}
          w-full h-full
        `}
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: getFoldOrigin(position),
        }}
      >
        {/* Front of fold */}
        <div
          className={`absolute inset-0 ${colors.front}`}
          style={{
            clipPath: getClipPath(position),
            filter: 'brightness(0.95)',
          }}
        />

        {/* Back of fold (showing paper backside) */}
        {showBackside && (
          <div
            className={`absolute inset-0 ${colors.back}`}
            style={{
              clipPath: getClipPath(position),
              transform: 'rotateX(180deg)',
              filter: 'sepia(0.2) brightness(0.9)',
            }}
          />
        )}

        {/* Shadow between layers */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: getClipPath(position),
            boxShadow: `2px 2px 8px ${colors.shadow}`,
          }}
        />
      </motion.div>

      {/* Subtle highlight on fold edge */}
      <div
        className="absolute w-px bg-white/20"
        style={{
          ...getHighlightPosition(position),
          background: `linear-gradient(${getHighlightGradient(position)}, rgba(255,255,255,0.15), transparent)`,
        }}
      />
    </div>
  );
}

function getFoldOrigin(position: OrigamiCornerProps['position']): string {
  switch (position) {
    case 'top-left': return 'top left';
    case 'top-right': return 'top right';
    case 'bottom-left': return 'bottom left';
    case 'bottom-right': return 'bottom right';
    default: return 'top left';
  }
}

function getClipPath(position: OrigamiCornerProps['position']): string {
  switch (position) {
    case 'top-left': return 'polygon(0 0, 0 100%, 100% 0)';
    case 'top-right': return 'polygon(100% 0, 0 0, 100% 100%)';
    case 'bottom-left': return 'polygon(0 0, 0 100%, 100% 100%)';
    case 'bottom-right': return 'polygon(0 100%, 100% 0, 100% 100%)';
    default: return 'polygon(0 0, 0 100%, 100% 0)';
  }
}

function getHighlightPosition(position: OrigamiCornerProps['position']): Record<string, string> {
  switch (position) {
    case 'top-left': return { top: '0', left: '0', width: '2px', height: '100%', transform: 'rotate(-45deg)', transformOrigin: 'top left' };
    case 'top-right': return { top: '0', right: '0', width: '2px', height: '100%', transform: 'rotate(45deg)', transformOrigin: 'top right' };
    case 'bottom-left': return { bottom: '0', left: '0', width: '2px', height: '100%', transform: 'rotate(45deg)', transformOrigin: 'bottom left' };
    case 'bottom-right': return { bottom: '0', right: '0', width: '2px', height: '100%', transform: 'rotate(-45deg)', transformOrigin: 'bottom right' };
    default: return { top: '0', left: '0', width: '2px', height: '100%', transform: 'rotate(-45deg)', transformOrigin: 'top left' };
  }
}

function getHighlightGradient(position: OrigamiCornerProps['position']): string {
  switch (position) {
    case 'top-left': return 'to bottom right';
    case 'top-right': return 'to bottom left';
    case 'bottom-left': return 'to top right';
    case 'bottom-right': return 'to top left';
    default: return 'to bottom right';
  }
}

/* ─────────────────────────────────────────────────────────────
   OrigamiDivider — Folded paper section divider
   ───────────────────────────────────────────────────────────── */

export interface OrigamiDividerProps {
  orientation?: 'horizontal' | 'vertical';
  length?: 'sm' | 'md' | 'lg' | 'full';
  variant?: 'single' | 'double' | 'zigzag';
  color?: 'paper' | 'aged' | 'sepia' | 'rust';
  foldCount?: 2 | 3 | 4;
  showBackside?: boolean;
  className?: string;
  children?: ReactNode;
}

const dividerLengthClasses = {
  sm: 'w-24',
  md: 'w-40',
  lg: 'w-64',
  full: 'w-full',
};

const dividerColorClasses = {
  paper: {
    front: 'bg-paper',
    back: 'bg-aged-stock',
    accent: 'bg-warm-gray/50',
  },
  aged: {
    front: 'bg-aged-stock',
    back: 'bg-warm-gray',
    accent: 'bg-muted-gray/50',
  },
  sepia: {
    front: 'bg-sepia-mid',
    back: 'bg-archive-brown',
    accent: 'bg-ink/20',
  },
  rust: {
    front: 'bg-rust',
    back: 'bg-rust-dark',
    accent: 'bg-paper/20',
  },
};

export function OrigamiDivider({
  orientation = 'horizontal',
  length = 'full',
  variant = 'single',
  color = 'aged',
  foldCount = 3,
  showBackside = true,
  className = '',
  children,
}: OrigamiDividerProps) {
  const isHorizontal = orientation === 'horizontal';
  const prefersReducedMotion = useReducedMotion();

  const containerClasses = isHorizontal
    ? `h-12 ${dividerLengthClasses[length]}`
    : `w-12 flex-col ${dividerLengthClasses[length]}`;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scaleX: isHorizontal ? 0 : 1, scaleY: isHorizontal ? 1 : 0 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, scaleX: 1, scaleY: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      className={`flex ${isHorizontal ? 'items-center' : 'items-center'} ${containerClasses} ${className}`}
      aria-label="Section divider"
      role="separator"
    >
      {/* Left/Top fold segments */}
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${isHorizontal ? 'h-full' : 'w-full'}`}>
        {Array.from({ length: foldCount }).map((_, index) => (
          <FoldSegment
            key={`left-${index}`}
            index={index}
            orientation={orientation}
            color={color}
            showBackside={showBackside}
            variant={variant}
            isLeft={true}
          />
        ))}
      </div>

      {/* Center content (optional) */}
      {children && (
        <div className={`
          flex-shrink-0 px-3 py-1
          ${isHorizontal ? 'mx-2' : 'my-2'}
          font-body text-caption text-sepia-mid tracking-widest uppercase
        `}>
          {children}
        </div>
      )}

      {/* Right/Bottom fold segments (mirror of left) */}
      <div className={`flex ${isHorizontal ? 'flex-row-reverse' : 'flex-col-reverse'} ${isHorizontal ? 'h-full' : 'w-full'}`}>
        {Array.from({ length: foldCount }).map((_, index) => (
          <FoldSegment
            key={`right-${index}`}
            index={index}
            orientation={orientation}
            color={color}
            showBackside={showBackside}
            variant={variant}
            isLeft={false}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface FoldSegmentProps {
  index: number;
  orientation: 'horizontal' | 'vertical';
  color: keyof typeof dividerColorClasses;
  showBackside: boolean;
  variant: 'single' | 'double' | 'zigzag';
  isLeft: boolean;
}

function FoldSegment({
  index,
  orientation,
  color,
  showBackside,
  variant,
  isLeft,
}: FoldSegmentProps) {
  const colors = dividerColorClasses[color];
  const prefersReducedMotion = useReducedMotion();
  const isHorizontal = orientation === 'horizontal';
  const segmentSize = isHorizontal ? 'w-6 h-full' : 'h-6 w-full';

  // Calculate alternating angles for zigzag variant
  const zigzagAngle = variant === 'zigzag' ? (index % 2 === 0 ? -3 : 3) : 0;
  const baseRotate = isLeft ? 0 : 180;
  const rotate = baseRotate + zigzagAngle;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, rotate: baseRotate + 90 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, rotate }}
      transition={prefersReducedMotion ? { duration: 0 } : {
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      className={`relative ${segmentSize}`}
      style={{ perspective: '150px' }}
    >
      {/* Front face */}
      <div
        className={`
          absolute inset-0 ${colors.front}
          ${isHorizontal ? 'origin-left' : 'origin-top'}
        `}
        style={{
          transform: `rotate${isHorizontal ? 'Y' : 'X'}(${isLeft ? '0deg' : '180deg'})`,
          filter: 'brightness(0.98)',
        }}
      />

      {/* Back face (paper backside) */}
      {showBackside && (
        <div
          className={`
            absolute inset-0 ${colors.back}
            ${isHorizontal ? 'origin-left' : 'origin-top'}
          `}
          style={{
            transform: `rotate${isHorizontal ? 'Y' : 'X'}(${isLeft ? '0deg' : '180deg'}) rotateX(180deg)`,
            filter: 'sepia(0.15) brightness(0.92)',
          }}
        />
      )}

      {/* Fold shadow */}
      <div
        className={`
          absolute ${isHorizontal ? 'w-1 h-full right-0' : 'h-1 w-full bottom-0'}
          pointer-events-none
        `}
        style={{
          background: `linear-gradient(${isHorizontal ? 'to right' : 'to bottom'}, transparent, ${colors.accent}, transparent)`,
          boxShadow: `0 0 4px ${colors.accent}`,
        }}
      />

      {/* Fold crease line */}
      <div
        className={`
          absolute ${isHorizontal ? 'w-px h-full' : 'h-px w-full'}
          bg-ink/10
        `}
        style={{
          [isHorizontal ? (isLeft ? 'left' : 'right') : (isLeft ? 'top' : 'bottom')]: '0',
        }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   OrigamiFoldAccent — Decorative accent piece for corners
   ───────────────────────────────────────────────────────────── */

export interface OrigamiFoldAccentProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
}

export function OrigamiFoldAccent({
  position,
  size = 'md',
  intensity = 'medium',
  className = '',
}: OrigamiFoldAccentProps) {
  const sizeValue = { sm: 24, md: 40, lg: 60 }[size];
  const opacityValue = { subtle: 0.3, medium: 0.5, strong: 0.7 }[intensity];

  const positionStyles = {
    'top-left': { top: 0, left: 0 },
    'top-right': { top: 0, right: 0 },
    'bottom-left': { bottom: 0, left: 0 },
    'bottom-right': { bottom: 0, right: 0 },
  };

  const foldDirection = {
    'top-left': 'rotate(-135deg)',
    'top-right': 'rotate(-45deg)',
    'bottom-left': 'rotate(135deg)',
    'bottom-right': 'rotate(45deg)',
  };

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        ...positionStyles[position],
        width: sizeValue,
        height: sizeValue,
      }}
      aria-hidden="true"
    >
      {/* Folded paper corner shape */}
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full"
        style={{ transform: foldDirection[position] }}
      >
        {/* Shadow */}
        <path
          d="M0 0 L40 0 L40 40 Z"
          fill={`rgba(26, 26, 22, ${opacityValue * 0.15})`}
          filter="blur(2px)"
        />

        {/* Front face */}
        <path
          d="M0 0 L40 0 L40 40 Z"
          fill="#EDE6D6"
          style={{ stroke: 'color-mix(in srgb, var(--color-ink) 8%, transparent)', strokeWidth: 0.5 }}
        />

        {/* Back face (showing through) */}
        <path
          d="M0 0 L40 40 L0 40 Z"
          fill="#D4CFC4"
          opacity="0.6"
        />

        {/* Crease line */}
        <line
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          style={{ stroke: 'color-mix(in srgb, var(--color-ink) 10%, transparent)', strokeWidth: 0.5 }}
        />

        {/* Highlight on fold edge */}
        <line
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="0.5"
          style={{ mixBlendMode: 'overlay' }}
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   OrigamiPaperStrip — A strip of folded paper for decorative use
   ───────────────────────────────────────────────────────────── */

export interface OrigamiPaperStripProps {
  orientation?: 'horizontal' | 'vertical';
  foldCount?: 3 | 4 | 5;
  color?: 'paper' | 'aged' | 'sepia';
  animated?: boolean;
  className?: string;
}

export function OrigamiPaperStrip({
  orientation = 'horizontal',
  foldCount = 4,
  color = 'aged',
  animated = true,
  className = '',
}: OrigamiPaperStripProps) {
  const colors = {
    paper: { front: '#F5F0E8', back: '#EDE6D6', shadow: 'color-mix(in srgb, var(--color-ink) 6%, transparent)' },
    aged: { front: '#EDE6D6', back: '#D4CFC4', shadow: 'color-mix(in srgb, var(--color-ink) 10%, transparent)' },
    sepia: { front: '#5C4D3D', back: '#5C4033', shadow: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' },
  }[color];

  const prefersReducedMotion = useReducedMotion();
  const isHorizontal = orientation === 'horizontal';
  const stripSize = isHorizontal ? { width: foldCount * 20, height: 12 } : { width: 12, height: foldCount * 20 };

  return (
    <motion.div
      initial={animated && !prefersReducedMotion ? { opacity: 0, scale: 0.8 } : {}}
      animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className={`flex ${isHorizontal ? '' : 'flex-col'} ${className}`}
      style={stripSize}
      aria-hidden="true"
    >
      {Array.from({ length: foldCount }).map((_, index) => {
        const isEven = index % 2 === 0;
        const rotateValue = isEven ? -2 : 2;

        return (
          <motion.div
            key={index}
            initial={animated && !prefersReducedMotion ? { rotate: isEven ? 5 : -5, opacity: 0 } : {}}
            animate={prefersReducedMotion ? {} : { rotate: rotateValue, opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : {
              duration: 0.4,
              delay: animated ? index * 0.08 : 0,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className={`
              flex-shrink-0 ${isHorizontal ? 'w-5 h-full' : 'h-5 w-full'}
            `}
            style={{
              perspective: '100px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Paper strip segment */}
            <div
              className="w-full h-full"
              style={{
                background: isEven ? colors.front : colors.back,
                boxShadow: `1px 1px 3px ${colors.shadow}`,
                filter: isEven ? 'brightness(0.98)' : 'sepia(0.1) brightness(0.95)',
              }}
            />

            {/* Subtle shadow between segments */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: `1px 0 2px ${colors.shadow}`,
              }}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default OrigamiCorner;
