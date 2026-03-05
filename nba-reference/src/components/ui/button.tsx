import type { ButtonHTMLAttributes, JSX } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'accent' | 'muted' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassMap: Record<ButtonVariant, string> = {
  default:
    'border border-line bg-button-bg text-muted-strong hover:-translate-y-0.5 hover:bg-button-hover active:translate-y-0 active:scale-[0.98]',
  accent: 'bg-accent text-white hover:bg-accent/90',
  muted: 'border border-line text-muted',
  danger: 'bg-blue-600 text-white hover:bg-blue-700',
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2 text-sm font-medium',
};

export function Button({
  className,
  variant = 'default',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={cn(
        'rounded transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variantClassMap[variant],
        sizeClassMap[size],
        className
      )}
      {...props}
    />
  );
}
