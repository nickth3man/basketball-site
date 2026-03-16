/**
 * @fileoverview Root layout component - wraps all pages with global styles and navigation.
 *
 * This is the root layout for the Next.js App Router. It provides:
 * - Global CSS imports and font configuration
 * - Site header navigation (sticky)
 * - Geist font family (Sans and Mono variants)
 * - HTML lang attribute for accessibility
 *
 * @module @/app/layout
 */

import type React from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { ErrorBoundary } from '@/components/error-boundary';
import { getSiteUrl, getSiteUrlObject } from '@/lib/site-config';
import { cn } from '@/lib/utils';

/**
 * Geist Sans font configuration.
 * Used for body text and UI elements.
 */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

/**
 * Geist Mono font configuration.
 * Used for code, numbers, and tabular data.
 */
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      <body className={cn(geistSans.variable, geistMono.variable, 'antialiased')}>
        <a
          href="#main-content"
          className="sr-only absolute top-4 left-4 z-50 rounded bg-paper px-3 py-2 text-sm text-heading shadow-popover focus:not-sr-only"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <ErrorBoundary>
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
