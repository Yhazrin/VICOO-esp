import { forwardRef, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface VintageSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  className?: string;
}

export const VintageSelect = forwardRef<HTMLSelectElement, VintageSelectProps>(
  ({ label, options, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const prefersReducedMotion = useReducedMotion();

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="font-body text-overline text-sepia-mid tracking-[0.2em] uppercase"
          >
            {label}
          </label>
        )}
        <motion.div
          whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
          className="relative"
        >
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rust/30 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rust/30 pointer-events-none" />

          <select
            ref={ref}
            id={selectId}
            className={`
              w-full font-body text-body-sm bg-transparent border-b-2 border-warm-gray/40
              py-2.5 pr-8 appearance-none cursor-pointer transition-all duration-300
              focus:outline-none focus-visible:ring-2 focus-visible:ring-rust/50 focus:border-rust text-ink
              ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
            <svg
              className="w-4 h-4 text-sepia-mid"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </motion.div>
      </div>
    );
  }
);

VintageSelect.displayName = 'VintageSelect';

export default VintageSelect;
