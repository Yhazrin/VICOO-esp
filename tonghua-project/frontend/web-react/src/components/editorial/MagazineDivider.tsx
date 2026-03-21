
interface MagazineDividerProps {
  variant?: 'simple' | 'decorative' | 'numbered';
  number?: string;
  className?: string;
}

export const MagazineDivider = ({
  variant = 'simple',
  number,
  className = '',
}: MagazineDividerProps) => {
  if (variant === 'numbered' && number) {
    return (
      <div className={`flex items-center gap-4 my-8 ${className}`}>
        <div className="flex-1 h-px bg-ink/20" aria-hidden="true" />
        <span className="font-body text-overline text-sepia-mid tracking-[0.3em]">
          {number}
        </span>
        <div className="flex-1 h-px bg-ink/20" aria-hidden="true" />
      </div>
    );
  }

  if (variant === 'decorative') {
    return (
      <div className={`flex items-center justify-center gap-3 my-8 ${className}`}>
        <div className="w-12 h-px bg-ink/30" aria-hidden="true" />
        <div className="w-2 h-2 rotate-45 bg-ink/30" aria-hidden="true" />
        <div className="w-12 h-px bg-ink/30" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={`editorial-divider ${className}`} aria-hidden="true" />
  );
};

export default MagazineDivider;
