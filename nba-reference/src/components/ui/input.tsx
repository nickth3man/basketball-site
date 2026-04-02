import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'rounded-md bg-paper-soft/95 px-3 py-2 text-sm text-ink shadow-input outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_16%,transparent)] backdrop-blur-sm transition-all duration-200 placeholder:text-placeholder focus:border-transparent focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1 focus:ring-offset-[var(--paper-soft)] focus:outline-none',
        className
      )}
      {...props}
    />
  );
});
