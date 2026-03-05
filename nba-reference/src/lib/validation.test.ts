import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));

import {
  validateBrefId,
  validatePositiveInt,
  validateSeasonId,
  validateTeamAbbrev,
} from '@/lib/validation';

describe('validation helpers', () => {
  it('accepts valid Basketball-Reference ids', () => {
    expect(validateBrefId('jamesle01')).toBe('jamesle01');
    expect(validateBrefId('curryst01')).toBe('curryst01');
  });

  it('rejects invalid Basketball-Reference ids', () => {
    expect(() => validateBrefId('JamesLe01')).toThrow('NOT_FOUND');
    expect(() => validateBrefId('jamesle')).toThrow('NOT_FOUND');
    expect(() => validateBrefId('j01')).toThrow('NOT_FOUND');
  });

  it('accepts valid team abbreviations', () => {
    expect(validateTeamAbbrev('LAL')).toBe('LAL');
    expect(validateTeamAbbrev('BOS')).toBe('BOS');
  });

  it('rejects invalid team abbreviations', () => {
    expect(() => validateTeamAbbrev('lal')).toThrow('NOT_FOUND');
    expect(() => validateTeamAbbrev('LA')).toThrow('NOT_FOUND');
    expect(() => validateTeamAbbrev('LALX')).toThrow('NOT_FOUND');
  });

  it('accepts valid season ids', () => {
    expect(validateSeasonId('2024-25')).toBe('2024-25');
    expect(validateSeasonId('1999-00')).toBe('1999-00');
  });

  it('rejects invalid season ids', () => {
    expect(() => validateSeasonId('202425')).toThrow('NOT_FOUND');
    expect(() => validateSeasonId('24-25')).toThrow('NOT_FOUND');
    expect(() => validateSeasonId('2024/25')).toThrow('NOT_FOUND');
  });

  it('accepts positive integers within bounds', () => {
    expect(validatePositiveInt('1')).toBe(1);
    expect(validatePositiveInt('100', 200)).toBe(100);
  });

  it('rejects non-integers, negatives, and out-of-range values', () => {
    expect(() => validatePositiveInt('0')).toThrow('NOT_FOUND');
    expect(() => validatePositiveInt('-1')).toThrow('NOT_FOUND');
    expect(() => validatePositiveInt('3.14')).toThrow('NOT_FOUND');
    expect(() => validatePositiveInt('10001')).toThrow('NOT_FOUND');
    expect(() => validatePositiveInt('201', 200)).toThrow('NOT_FOUND');
  });
});
