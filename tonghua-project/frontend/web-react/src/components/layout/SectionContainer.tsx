import { type ReactNode } from 'react';

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  noTopSpacing?: boolean;
  narrow?: boolean;
  decorativeDivider?: boolean;
}

export default function SectionContainer({
  children,
  className = '',
  noPadding = false,
  noTopSpacing = false,
  narrow = false,
  decorativeDivider = false,
}: SectionContainerProps) {
  return (
    <section
      className={`
        ${noPadding ? '' : noTopSpacing ? 'pb-16 md:pb-24' : 'section-spacing'}
        ${className}
        relative
      `}
    >
      {/* Optional decorative divider at top */}
      {decorativeDivider && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-rust/30" aria-hidden="true" />
      )}

      <div
        className={`
          mx-auto px-6 md:px-10
          ${narrow ? 'max-w-3xl' : 'max-w-[1400px]'}
        `}
      >
        {children}
      </div>
    </section>
  );
}
