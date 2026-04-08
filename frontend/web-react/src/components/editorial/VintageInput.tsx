import { forwardRef, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface VintageInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea';
  helperText?: string;
  error?: string;
  icon?: 'search' | 'email' | 'user' | 'lock';
  suffix?: React.ReactNode;
}

export const VintageInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, VintageInputProps>(
  ({ label, type = 'text', helperText, error, icon, suffix, className = '', ...props }, ref) => {
    const id = useId();
    const prefersReducedMotion = useReducedMotion();
    const inputId = `${id}-input`;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;

    const baseClasses = `
      w-full font-body text-body-sm py-3 px-0
      border-b-2 border-warm-gray/60
      bg-transparent
      transition-all duration-300 ease-editorial
      placeholder:text-ink-faded/80
      focus:outline-none
      focus-visible:ring-2 focus-visible:ring-rust/50
      focus:border-rust
      ${error ? 'border-archive-brown' : ''}
    `;

    // Extract props that conflict with framer-motion types
    const {
      onDrag,
      onDragEnd,
      onDragEnter,
      onDragExit,
      onDragLeave,
      onDragOver,
      onDragStart,
      onDrop,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      ...restProps
    } = props;

    const describedBy = error ? errorId : helperText ? helperId : undefined;

    const inputProps = {
      id: inputId,
      ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      'aria-invalid': !!error,
      className: baseClasses + ' ' + className,
      ...restProps,
    };

    const iconSvg = icon === 'search' ? (
      <svg className="w-4 h-4 text-sepia-mid mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ) : icon === 'email' ? (
      <svg className="w-4 h-4 text-sepia-mid mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ) : null;

    return (
      <div className="space-y-2 relative">
        {label && (
          <label
            htmlFor={inputId}
            className="font-body text-overline tracking-[0.2em] uppercase text-sepia-mid block"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-rust/30 pointer-events-none z-10" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-rust/30 pointer-events-none z-10" aria-hidden="true" />

          {type === 'textarea' ? (
            <motion.textarea
              {...inputProps}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              rows={4}
              whileFocus={prefersReducedMotion ? undefined : { scale: 1.01 }}
              className={baseClasses + ' ' + className + ' pt-3 pl-3 pr-3'}
            />
          ) : icon ? (
            <div className="flex items-center border-b-2 border-warm-gray/60 focus-within:border-rust transition-colors">
              {iconSvg}
              <motion.input
                {...inputProps}
                ref={ref as React.Ref<HTMLInputElement>}
                type={type}
                whileFocus={prefersReducedMotion ? undefined : { scale: 1.01 }}
                className={baseClasses + ' ' + className + ' border-none pl-0'}
              />
            </div>
          ) : (
            <div className="relative">
              <motion.input
                {...inputProps}
                ref={ref as React.Ref<HTMLInputElement>}
                type={type}
                whileFocus={prefersReducedMotion ? undefined : { scale: 1.01 }}
                className={baseClasses + ' ' + className + ' pt-3 pl-3 ' + (suffix ? 'pr-10' : 'pr-3')}
              />
              {suffix && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-3 flex items-center z-20">
                  {suffix}
                </div>
              )}
            </div>
          )}
        </div>

        {helperText && (
          <p id={helperId} className="font-body text-overline text-sepia-mid">
            {helperText}
          </p>
        )}

        {error && (
          <motion.p
            role="alert"
            id={errorId}
            initial={prefersReducedMotion ? false : { opacity: 0, y: -5 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            className="font-body text-overline text-archive-brown"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

VintageInput.displayName = 'VintageInput';
