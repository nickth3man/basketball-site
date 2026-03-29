import type { HTMLAttributes, JSX } from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'altar' | 'pedestal' | 'glass' | 'inset';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article' | 'aside';
  variant?: CardVariant;
}

const variantClassMap: Record<CardVariant, string> = {
  altar: 'surface-altar p-5',
  pedestal: 'surface-pedestal p-5',
  glass: 'surface-glass p-4',
  inset: 'surface-inset p-3',
};

export function Card({
  as = 'section',
  variant = 'pedestal',
  className,
  ...props
}: CardProps): JSX.Element {
  const Component = as;
  return <Component className={cn(variantClassMap[variant], className)} {...props} />;
}
