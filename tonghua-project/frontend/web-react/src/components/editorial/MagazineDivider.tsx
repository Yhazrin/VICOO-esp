
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
        <div className="flex-1 h-px bg-ink/20" />
        <span className="font-mono text-[10px] text-sepia-mid tracking-[0.3em]">
          {number}
        </span>
        <div className="flex-1 h-px bg-ink/20" />
      </div>
    );
  }

  if (variant === 'decorative') {
    return (
      <div className={`flex items-center justify-center gap-3 my-8 ${className}`}>
        <div className="w-12 h-px bg-ink/30" />
        <div className="w-2 h-2 rotate-45 bg-ink/30" />
        <div className="w-12 h-px bg-ink/30" />
      </div>
    );
  }

  return (
    <div className={`editorial-divider ${className}`} />
  );
};

export default MagazineDivider;
