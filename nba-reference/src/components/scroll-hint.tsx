/**
 * @fileoverview ScrollHint component — indicates horizontal scroll availability.
 *
 * Wraps a scrollable container and shows a subtle right-edge gradient shadow
 * with a "Scroll →" label when the content overflows horizontally. The hint
 * fades once the user scrolls to the end or reaches the right edge.
 *
 * @module @/components/scroll-hint
 */

'use client';

import type { JSX, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScrollHintProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a horizontally scrollable element and overlays a fade + "Scroll →"
 * indicator on the trailing edge when more content is available to the right.
 *
 * @param children - The scrollable content (typically a `<table>`)
 * @param className - Optional additional class names for the scroll container
 * @returns A positioned wrapper with the scroll hint overlay
 */
export function ScrollHint({ children, className }: ScrollHintProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback((): void => {
    const el = containerRef.current;
    if (el == null) return;
    // Can scroll right when scrollLeft + clientWidth < scrollWidth (with 2px tolerance)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el == null) return;

    updateScrollState();

    el.addEventListener('scroll', updateScrollState, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [updateScrollState]);

  return (
    <div className="relative rounded-md">
      {/* Scrollable table container */}
      <div ref={containerRef} className={cn('overflow-x-auto', className)}>
        {children}
      </div>

      {/* Right-edge fade gradient + label — only on mobile (hidden lg+) */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 flex w-14 flex-col items-end justify-center pr-2 transition-opacity duration-300 lg:hidden',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background:
            'linear-gradient(to right, transparent, color-mix(in srgb, var(--dc-surface-container-low) 92%, transparent))',
        }}
      >
        <span className="rounded bg-[var(--dc-surface-container-low)]/80 px-1 py-0.5 text-xs font-medium text-muted shadow-sm">
          scroll →
        </span>
      </div>
    </div>
  );
}
