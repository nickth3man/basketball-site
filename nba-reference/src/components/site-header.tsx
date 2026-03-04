/**
 * @fileoverview Global site header with navigation.
 *
 * Provides the main navigation header displayed on all pages.
 * Uses sticky positioning to remain visible during scroll.
 * Includes gradient background and animated link hover effects.
 *
 * @module @/components/site-header
 */

import type { JSX } from 'react';
import Link from 'next/link';

/**
 * Renders the global site header with logo and primary navigation.
 *
 * The header is sticky with a gradient background and contains a home link labeled "NBA Reference" plus navigation links for Players, Teams, Games, and Seasons.
 *
 * @returns The header JSX element for the site's global navigation.
 */
export function SiteHeader(): JSX.Element {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-linear-to-r from-header-start via-header-mid to-header-start text-header-text shadow-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo / Home link */}
        <Link
          href="/"
          className="text-lg font-bold tracking-wide text-accent transition-all duration-200 hover:brightness-110"
        >
          NBA Reference
        </Link>

        {/* Main navigation */}
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/players" className="transition-colors duration-200 hover:text-white">
            Players
          </Link>
          <Link href="/teams" className="transition-colors duration-200 hover:text-white">
            Teams
          </Link>
          <Link href="/games" className="transition-colors duration-200 hover:text-white">
            Games
          </Link>
          <Link href="/seasons" className="transition-colors duration-200 hover:text-white">
            Seasons
          </Link>
        </nav>
      </div>
    </header>
  );
}
