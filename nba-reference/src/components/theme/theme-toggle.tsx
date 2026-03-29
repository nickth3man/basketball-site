'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import type { JSX } from 'react';
import { cn } from '@/lib/utils';

const noopSubscribe = (): (() => void) => () => undefined;
const getServerSnapshot = (): boolean => false;
const getClientSnapshot = (): boolean => true;

const toggleBaseClass =
  'flex h-8 w-8 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--dc-surface-container-highest)35%,transparent)] text-header-text outline outline-1 outline-[color-mix(in_srgb,var(--dc-tertiary-fixed)_22%,transparent)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--dc-surface-container-highest)55%,transparent)] hover:shadow-[0_0_12px_color-mix(in_srgb,var(--dc-tertiary-container)_30%,transparent)]';

/**
 * Theme toggle button that cycles through light → dark → system modes.
 */
export function ThemeToggle(): JSX.Element {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot);

  const cycleTheme = (): void => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  if (!mounted) {
    return (
      <button type="button" className={cn(toggleBaseClass)} aria-label="Toggle theme">
        <span className="h-4 w-4" />
      </button>
    );
  }

  const currentTheme = theme ?? 'system';
  const effectiveTheme = resolvedTheme ?? 'light';

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(toggleBaseClass)}
      aria-label={`Current theme: ${currentTheme}. Click to switch to ${currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light'} mode.`}
    >
      {effectiveTheme === 'dark' ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}
