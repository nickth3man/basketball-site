import { describe, expect, it } from 'vitest';
import { formatPercentage, formatSignedNumber, formatUsd } from './formatters';

describe('formatters', () => {
  describe('formatPercentage', () => {
    it('formats decimal as 3-digit percentage string', () => {
      expect(formatPercentage(0.452)).toBe('0.452');
      expect(formatPercentage(0.5)).toBe('0.500');
      expect(formatPercentage(0)).toBe('0.000');
      expect(formatPercentage(1)).toBe('1.000');
    });

    it('handles string numeric inputs', () => {
      expect(formatPercentage('0.452')).toBe('0.452');
      expect(formatPercentage('0.5')).toBe('0.500');
    });

    it('returns dash for null values', () => {
      expect(formatPercentage(null)).toBe('-');
    });

    it('returns dash for undefined values', () => {
      expect(formatPercentage(undefined)).toBe('-');
    });

    it('returns dash for NaN values', () => {
      expect(formatPercentage(NaN)).toBe('-');
    });

    it('returns dash for non-numeric strings', () => {
      expect(formatPercentage('not-a-number')).toBe('-');
      expect(formatPercentage('')).toBe('-');
    });

    it('handles extreme values', () => {
      expect(formatPercentage(0.999999)).toBe('1.000');
      expect(formatPercentage(0.001)).toBe('0.001');
    });
  });

  describe('formatUsd', () => {
    it('formats number as US dollar currency', () => {
      expect(formatUsd(45000000)).toBe('$45,000,000');
      expect(formatUsd(1000000)).toBe('$1,000,000');
      expect(formatUsd(50000)).toBe('$50,000');
    });

    it('formats zero as $0', () => {
      expect(formatUsd(0)).toBe('$0');
    });

    it('handles string numeric inputs', () => {
      expect(formatUsd('45000000')).toBe('$45,000,000');
    });

    it('returns dash for null values', () => {
      expect(formatUsd(null)).toBe('-');
    });

    it('returns dash for undefined values', () => {
      expect(formatUsd(undefined)).toBe('-');
    });

    it('returns dash for NaN values', () => {
      expect(formatUsd(NaN)).toBe('-');
    });

    it('returns dash for empty string', () => {
      expect(formatUsd('')).toBe('-');
    });

    it('returns dash for whitespace-only string', () => {
      expect(formatUsd('   ')).toBe('-');
    });

    it('handles negative values', () => {
      expect(formatUsd(-50000)).toBe('-$50,000');
    });
  });

  describe('formatSignedNumber', () => {
    it('adds plus prefix to positive numbers', () => {
      expect(formatSignedNumber(5)).toBe('+5');
      expect(formatSignedNumber(1)).toBe('+1');
      expect(formatSignedNumber(100)).toBe('+100');
    });

    it('returns string without plus for zero', () => {
      expect(formatSignedNumber(0)).toBe('0');
    });

    it('returns string without plus for negative numbers', () => {
      expect(formatSignedNumber(-5)).toBe('-5');
      expect(formatSignedNumber(-1)).toBe('-1');
      expect(formatSignedNumber(-100)).toBe('-100');
    });

    it('returns dash for null values', () => {
      expect(formatSignedNumber(null)).toBe('-');
    });

    it('returns dash for undefined values', () => {
      expect(formatSignedNumber(undefined)).toBe('-');
    });

    it('handles decimal numbers', () => {
      expect(formatSignedNumber(5.5)).toBe('+5.5');
      expect(formatSignedNumber(-3.14)).toBe('-3.14');
    });
  });
});
