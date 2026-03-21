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
import type { Route } from 'next';
import Link from 'next/link';
import { MobileNav } from '@/components/mobile-nav';
import { ThemeToggle } from '@/components/theme';

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
        <nav aria-label="Primary" className="hidden items-center gap-4 text-sm lg:flex">
          <Link
            href={'/search' as Route}
            className="transition-colors duration-200 hover:text-white"
          >
            Search
          </Link>
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
          <Link href="/leagues" className="transition-colors duration-200 hover:text-white">
            Leagues
          </Link>
          <Link href="/boxscores" className="transition-colors duration-200 hover:text-white">
            Box Scores
          </Link>
          <Link href="/leaders" className="transition-colors duration-200 hover:text-white">
            Leaders
          </Link>
          <Link href="/draft" className="transition-colors duration-200 hover:text-white">
            Draft
          </Link>
          <Link
            href={'/allstar' as Route}
            className="transition-colors duration-200 hover:text-white"
          >
            All-Star
          </Link>
          <Link
            href={'/playoffs' as Route}
            className="transition-colors duration-200 hover:text-white"
          >
            Playoffs
          </Link>
          <Link
            href={'/awards' as Route}
            className="transition-colors duration-200 hover:text-white"
          >
            Awards
          </Link>
          <Link
            href={'/compare' as Route}
            className="transition-colors duration-200 hover:text-white"
          >
            Compare
          </Link>
          <Link
            href={'/standings' as Route}
            className="transition-colors duration-200 hover:text-white"
          >
            Standings
          </Link>
          <Link
            href={'/friv/birthdays' as Route}
            className="transition-colors duration-200 hover:text-white"
          >
            Frivolities
          </Link>
          <ThemeToggle />
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
