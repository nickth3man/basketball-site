import type { HTMLAttributes, JSX } from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'paper' | 'soft' | 'white';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article' | 'aside';
  variant?: CardVariant;
}

const variantClassMap: Record<CardVariant, string> = {
  paper: 'panel-paper p-4',
  soft: 'border border-line bg-paper-soft p-4',
  white: 'border border-line-mid bg-white p-3',
};

export function Card({
  as = 'section',
  variant = 'paper',
  className,
  ...props
}: CardProps): JSX.Element {
  const Component = as;
  return <Component className={cn(variantClassMap[variant], className)} {...props} />;
}
