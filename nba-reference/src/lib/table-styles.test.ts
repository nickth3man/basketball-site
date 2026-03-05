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

    it('tableHeadRowClass has thead background', () => {
      expect(tableHeadRowClass).toBe('bg-thead');
    });

    it('tableBodyRowClass has alternating row colors and hover', () => {
      expect(tableBodyRowClass).toContain('odd:bg-white');
      expect(tableBodyRowClass).toContain('even:bg-row-alt');
      expect(tableBodyRowClass).toContain('hover:bg-row-hover');
      expect(tableBodyRowClass).toContain('transition-colors');
    });

    it('tableHeaderButtonClass is full width with hover', () => {
      expect(tableHeaderButtonClass).toContain('w-full');
      expect(tableHeaderButtonClass).toContain('cursor-pointer');
      expect(tableHeaderButtonClass).toContain('hover:text-muted');
    });

    it('tableLinkClass has underline transition', () => {
      expect(tableLinkClass).toContain('text-link');
      expect(tableLinkClass).toContain('decoration-transparent');
      expect(tableLinkClass).toContain('hover:decoration-current');
    });
  });

  describe('tableHeaderCellClass', () => {
    it('returns left-aligned classes by default', () => {
      const classes = tableHeaderCellClass();
      expect(classes).toContain('border');
      expect(classes).toContain('border-line');
      expect(classes).toContain('px-2');
      expect(classes).toContain('py-1');
      expect(classes).toContain('text-left');
    });

    it('returns right-aligned classes when specified', () => {
      const classes = tableHeaderCellClass('right');
      expect(classes).toContain('text-right');
      expect(classes).not.toContain('text-left');
    });

    it('returns left-aligned classes when explicitly specified', () => {
      const classes = tableHeaderCellClass('left');
      expect(classes).toContain('text-left');
      expect(classes).not.toContain('text-right');
    });
  });

  describe('tableCellClass', () => {
    it('returns left-aligned classes by default', () => {
      const classes = tableCellClass();
      expect(classes).toContain('border');
      expect(classes).toContain('border-line-soft');
      expect(classes).toContain('px-2');
      expect(classes).toContain('py-1');
      expect(classes).toContain('text-left');
    });

    it('returns right-aligned classes with tabular-nums when specified', () => {
      const classes = tableCellClass('right');
      expect(classes).toContain('text-right');
      expect(classes).toContain('tabular-nums');
      expect(classes).not.toContain('text-left');
    });

    it('returns left-aligned classes when explicitly specified', () => {
      const classes = tableCellClass('left');
      expect(classes).toContain('text-left');
      expect(classes).not.toContain('text-right');
      expect(classes).not.toContain('tabular-nums');
    });
  });
});
