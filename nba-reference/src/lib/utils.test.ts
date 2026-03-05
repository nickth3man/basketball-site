import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn (className utility)', () => {
  it('combines multiple string class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles single class name', () => {
    expect(cn('btn')).toBe('btn');
  });

  it('filters out falsy values', () => {
    const conditions = { showHidden: false };
    expect(cn('btn', conditions.showHidden && 'hidden', 'active')).toBe('btn active');
    expect(cn('btn', null, 'active')).toBe('btn active');
    expect(cn('btn', undefined, 'active')).toBe('btn active');
    expect(cn('btn', '', 'active')).toBe('btn active');
  });

  it('handles conditional classes with objects', () => {
    expect(cn('btn', { 'btn-active': true, 'btn-disabled': false })).toBe('btn btn-active');
  });

  it('handles arrays of classes', () => {
    expect(cn(['px-4', 'py-2'], 'btn')).toBe('px-4 py-2 btn');
  });

  it('merges conflicting tailwind classes (later wins)', () => {
    expect(cn('px-4', 'px-8')).toBe('px-8');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('handles complex conditional combinations', () => {
    const flags = { isActive: true, isDisabled: false };

    expect(
      cn(
        'btn',
        flags.isActive && 'btn-active',
        flags.isDisabled && 'opacity-50',
        ['px-4', 'py-2'],
        { rounded: true }
      )
    ).toBe('btn btn-active px-4 py-2 rounded');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('returns empty string for all falsy inputs', () => {
    expect(cn(null, undefined, false, '')).toBe('');
  });

  it('handles nested arrays', () => {
    expect(cn(['px-4', ['py-2', 'm-4']])).toBe('px-4 py-2 m-4');
  });

  it('merges margin classes correctly', () => {
    expect(cn('m-2', 'm-4')).toBe('m-4');
    expect(cn('mx-2', 'mx-4 my-2')).toBe('mx-4 my-2');
  });

  it('merges padding classes correctly', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('px-2', 'px-4 py-2')).toBe('px-4 py-2');
  });
});
