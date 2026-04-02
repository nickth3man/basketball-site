/**
 * @fileoverview Tailwind CSS utility classes for consistent table styling.
 *
 * Tonal separation (Digital Cathedral): no grid borders; alternating surfaces;
 * primary header row with on-primary text.
 *
 * @module @/lib/table-styles
 */

import { cn } from '@/lib/utils';

/** Horizontal scroll wrapper for wide tables */
export const tableContainerClass = 'overflow-x-auto';

/** Optional outer shell for a table block */
export function tableSectionClass(variant: 'default' | 'dense' | 'hero' = 'default'): string {
  if (variant === 'dense') {
    return 'surface-inset p-2';
  }
  if (variant === 'hero') {
    return 'surface-altar p-4';
  }
  return 'surface-pedestal p-3';
}

export const tableClass =
  'min-w-full border-collapse text-xs text-ink [font-feature-settings:"tnum"]';

/** Primary header row — lapis background, light inscription text */
export const tableHeadRowClass = 'bg-thead text-thead-ink';

/**
 * Body rows: alternating marble tones, generous hover.
 */
export const tableBodyRowClass =
  'transition-colors duration-200 odd:bg-surface even:bg-row-alt hover:bg-row-hover';

export const tableHeaderButtonClass =
  'w-full cursor-pointer text-left font-semibold text-inherit transition-colors duration-150 hover:text-[var(--dc-tertiary-fixed)]';

export const tableLinkClass =
  'text-link underline decoration-transparent transition-all duration-200 hover:decoration-current hover:brightness-110';

export type TableAlign = 'left' | 'right';

export function tableHeaderCellClass(align?: TableAlign, isFirst?: boolean): string {
  return cn(
    'px-3 py-2.5 font-semibold',
    align === 'right' ? 'text-right' : 'text-left',
    isFirst === true && 'sticky left-0 z-20 bg-thead'
  );
}

export function tableCellClass(align?: TableAlign, isFirst?: boolean): string {
  return cn(
    'px-3 py-2.5 align-middle',
    align === 'right' ? 'text-right tabular-nums' : 'text-left',
    isFirst === true && 'sticky left-0 z-10 bg-inherit'
  );
}

/** Highlighted row (e.g. keyed emphasis) without borders */
export function tableRowClass(isHighlighted?: boolean): string {
  if (isHighlighted === true) {
    return cn(
      'transition-colors duration-200 hover:bg-row-hover',
      'bg-[color-mix(in_srgb,var(--dc-tertiary-container)_12%,var(--dc-surface-container-low))]'
    );
  }
  return tableBodyRowClass;
}
