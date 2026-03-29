/**
 * @fileoverview Root layout component - wraps all pages with global styles and navigation.
 *
 * This is the root layout for the Next.js App Router. It provides:
 * - Global CSS imports and font configuration
 * - Site header navigation (sticky)
 * - Display/body serif fonts (Digital Cathedral typography)
 * - HTML lang attribute for accessibility
 *
 * @module @/app/layout
 */

import type React from 'react';
import type { Metadata } from 'next';
import { Newsreader, Noto_Serif } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme';
import { WebVitalsReporter } from '@/components/web-vitals';
import { getSiteUrl, getSiteUrlObject } from '@/lib/site-config';
import { cn } from '@/lib/utils';

/** Inscription / headlines — high-contrast serif */
const fontDisplay = Noto_Serif({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

/** Body / manuscript text */
const fontBody = Newsreader({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const siteUrl = getSiteUrl();

/**
 * Application metadata for SEO and browser display.
 */
export const metadata: Metadata = {
  title: 'NBA Reference',
  description: 'Basketball-reference style NBA stats explorer',
  metadataBase: getSiteUrlObject(),
  openGraph: {
    title: 'NBA Reference',
    description:
      'Basketball-reference style NBA stats explorer for players, teams, seasons, awards, and playoffs.',
    url: siteUrl,
    siteName: 'NBA Reference',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NBA Reference',
    description:
      'Basketball-reference style NBA stats explorer for players, teams, seasons, awards, and playoffs.',
  },
};

/**
 * Application root layout that applies global fonts and styles and renders the site header around page content.
 *
 * @param children - Page content for the current route
 * @returns The root HTML structure containing the site header and `children`
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body className={cn(fontDisplay.variable, fontBody.variable, 'font-sans antialiased')}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WebVitalsReporter />
          <a
            href="#main-content"
            className="sr-only absolute top-4 left-4 z-50 surface-altar rounded-md px-3 py-2 text-sm text-heading shadow-popover focus:not-sr-only focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--paper-soft)]"
          >
            Skip to main content
          </a>
          <SiteHeader />
          <ErrorBoundary>
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
