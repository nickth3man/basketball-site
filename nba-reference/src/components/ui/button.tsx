import type { ButtonHTMLAttributes, JSX } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'chip' | 'heroCta' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    'rounded-md bg-secondary text-on-secondary shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--dc-tertiary-fixed)_45%,transparent)] ambient-glow-hover hover:ambient-glow-hover-active hover:bg-[color-mix(in_srgb,var(--dc-secondary)88%,var(--dc-secondary-container)12%)] active:translate-y-px active:scale-[0.99]',
  secondary:
    'rounded-md bg-[var(--dc-surface-container-highest)] text-primary ambient-glow-hover hover:bg-[color-mix(in_srgb,var(--dc-surface-container-highest)90%,var(--dc-secondary)10%)] active:translate-y-px active:scale-[0.99]',
  ghost:
    'rounded-md bg-transparent text-muted-strong hover:bg-paper-soft/90 hover:text-heading active:translate-y-px',
  chip: 'rounded-full bg-[var(--dc-tertiary-fixed-dim)] px-3 py-1 text-sm font-medium text-[var(--dc-on-tertiary-fixed)] ambient-glow-hover hover:brightness-105 active:scale-[0.99]',
  heroCta:
    'rounded-md bg-gradient-to-br from-primary to-[var(--dc-primary-container)] text-on-primary font-medium shadow-input ambient-glow-hover hover:brightness-110 active:translate-y-px active:scale-[0.99]',
  danger:
    'rounded-md bg-danger text-white ambient-glow-hover hover:bg-danger-hover active:translate-y-px active:scale-[0.99]',
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-sm font-medium',
};

export function buttonStyles({
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
} = {}): string {
  return cn(
    'inline-flex items-center justify-center transition-all duration-200',
    disabled && 'cursor-not-allowed opacity-50',
    variantClassMap[variant],
    sizeClassMap[size],
    className
  );
}

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps): JSX.Element {
  const buttonClassName = buttonStyles({
    variant,
    size,
    ...(props.disabled !== undefined ? { disabled: props.disabled } : {}),
    ...(className !== undefined ? { className } : {}),
  });

  return <button type={type} className={buttonClassName} {...props} />;
}
