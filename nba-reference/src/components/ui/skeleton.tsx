import type { JSX } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps): JSX.Element {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[color-mix(in_srgb,var(--dc-surface-container-highest)55%,var(--dc-surface-container-low))]',
        className
      )}
    />
  );
}
