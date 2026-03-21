'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import type { JSX } from 'react';

/**
 * Theme provider wrapper for next-themes.
 *
 * Wraps the application to enable theme switching (light/dark/system).
 * Must be used at the root level to provide theme context to children.
 *
 * @param props - Theme provider props from next-themes
 * @param props.children - Child components to wrap
 * @returns The theme provider component
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps): JSX.Element {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
