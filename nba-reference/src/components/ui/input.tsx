import type { InputHTMLAttributes, JSX } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps): JSX.Element {
  return (
    <input
      className={cn(
        'rounded-md bg-paper-soft/95 px-3 py-2 text-sm text-ink shadow-input outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_16%,transparent)] backdrop-blur-sm transition-all duration-200 placeholder:text-placeholder focus:border-transparent focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1 focus:ring-offset-[var(--paper-soft)] focus:outline-none',
        className
      )}
      {...props}
    />
  );
}
