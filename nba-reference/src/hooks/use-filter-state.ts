/**
 * @fileoverview URL-backed filter state hook for persistent query parameters.
 *
 * Provides a hook that synchronizes filter state with URL search parameters,
 * allowing filters to persist across navigation and page refreshes.
 *
 * @module @/hooks/use-filter-state
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for managing filter state synchronized with URL search parameters.
 *
 * When the value changes, the URL is updated with `scroll: false` to prevent
 * jumping to the top of the page. Default values are not stored in the URL.
 *
 * @param key - The URL parameter key to use for persistence
 * @param defaultValue - The default value when no URL parameter exists
 * @returns A tuple of [currentValue, setValue] similar to useState
 *
 * @example
 * ```tsx
 * const [season, setSeason] = useFilterState('season', '2024');
 * // URL becomes ?season=2024 when setSeason('2024') is called
 * // Resetting: setSeason('') or setSeason(defaultValue) removes the param
 * ```
 */
export function useFilterState(
  key: string,
  defaultValue: string
): [string, (value: string) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (newValue: string): void => {
      const params = new URLSearchParams(searchParams.toString());
      if (newValue === defaultValue || newValue === '') {
        params.delete(key);
      } else {
        params.set(key, newValue);
      }
      const qs = params.toString();
      router.push(qs.length > 0 ? `?${qs}` : '?', { scroll: false });
    },
    [key, defaultValue, router, searchParams]
  );

  return [value, setValue];
}
