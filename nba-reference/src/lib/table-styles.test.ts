import { describe, expect, it } from 'vitest';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderButtonClass,
  tableHeaderCellClass,
  tableLinkClass,
  tableRowClass,
  tableSectionClass,
} from './table-styles';

describe('table-styles', () => {
  describe('static class constants', () => {
    it('tableContainerClass enables horizontal scroll', () => {
      expect(tableContainerClass).toContain('overflow-x-auto');
    });

    it('tableClass has correct base styles', () => {
      expect(tableClass).toContain('min-w-full');
      expect(tableClass).toContain('border-collapse');
      expect(tableClass).toContain('text-xs');
      expect(tableClass).toContain('text-ink');
    });

    it('tableHeadRowClass uses primary header treatment', () => {
      expect(tableHeadRowClass).toContain('bg-thead');
      expect(tableHeadRowClass).toContain('text-thead-ink');
    });

    it('tableBodyRowClass uses tonal striping without white rows', () => {
      expect(tableBodyRowClass).toContain('odd:bg-surface');
      expect(tableBodyRowClass).toContain('even:bg-row-alt');
      expect(tableBodyRowClass).toContain('hover:bg-row-hover');
      expect(tableBodyRowClass).toContain('transition-colors');
    });

    it('tableHeaderButtonClass is full width with gold hover hint', () => {
      expect(tableHeaderButtonClass).toContain('w-full');
      expect(tableHeaderButtonClass).toContain('cursor-pointer');
      expect(tableHeaderButtonClass).toContain('hover:text-[var(--dc-tertiary-fixed)]');
    });

    it('tableLinkClass avoids harsh underline default', () => {
      expect(tableLinkClass).toContain('text-link');
      expect(tableLinkClass).toContain('decoration-transparent');
      expect(tableLinkClass).toContain('hover:decoration-current');
    });
  });

  describe('tableSectionClass', () => {
    it('returns pedestal shell by default', () => {
      expect(tableSectionClass()).toContain('surface-pedestal');
    });
  });

  describe('tableRowClass', () => {
    it('matches body striping when not highlighted', () => {
      expect(tableRowClass()).toBe(tableBodyRowClass);
      expect(tableRowClass(false)).toBe(tableBodyRowClass);
    });

    it('uses tonal highlight without striping when highlighted', () => {
      expect(tableRowClass(true)).toContain(
        'bg-[color-mix(in_srgb,var(--dc-tertiary-container)_12%,var(--dc-surface-container-low))]'
      );
    });
  });

  describe('tableHeaderCellClass', () => {
    it('returns left-aligned classes by default without borders', () => {
      const classes = tableHeaderCellClass();
      expect(classes).toContain('px-3');
      expect(classes).toContain('py-2.5');
      expect(classes).toContain('text-left');
      expect(classes).not.toContain('border');
    });

    it('returns right-aligned classes when specified', () => {
      const classes = tableHeaderCellClass('right');
      expect(classes).toContain('text-right');
      expect(classes).not.toContain('text-left');
    });
  });

  describe('tableCellClass', () => {
    it('returns left-aligned classes by default without borders', () => {
      const classes = tableCellClass();
      expect(classes).toContain('px-3');
      expect(classes).toContain('py-2.5');
      expect(classes).toContain('text-left');
      expect(classes).not.toContain('border');
    });

    it('returns right-aligned classes with tabular-nums when specified', () => {
      const classes = tableCellClass('right');
      expect(classes).toContain('text-right');
      expect(classes).toContain('tabular-nums');
    });
  });
});
