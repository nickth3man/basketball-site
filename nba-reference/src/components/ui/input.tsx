import type { InputHTMLAttributes, JSX } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps): JSX.Element {
  return (
    <input
      className={cn(
        'rounded border border-line bg-white px-3 py-2 text-sm text-ink shadow-input transition-all duration-200 placeholder:text-placeholder focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none',
        className
      )}
      {...props}
    />
  );
}
