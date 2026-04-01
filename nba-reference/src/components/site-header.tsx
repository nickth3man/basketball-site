/**
 * @fileoverview Global site header with navigation.
 *
 * Provides the main navigation header displayed on all pages.
 * Uses sticky positioning to remain visible during scroll.
 * Editorial gradient band without hard divider lines; illuminated hover on links.
 *
 * @module @/components/site-header
 */

import type { JSX } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { MobileNav } from '@/components/mobile-nav';
import { ThemeToggle } from '@/components/theme';
import { cn } from '@/lib/utils';

const navLinkClass =
  'illuminated-tab rounded-md px-2 py-1.5 text-sm text-header-text/90 transition-all duration-200 hover:bg-white/10 hover:text-header-text hover:shadow-[0_0_14px_color-mix(in_srgb,var(--dc-tertiary-container)_28%,transparent)]';

/**
 * Renders the global site header with logo and primary navigation.
 *
 * @returns The header JSX element for the site's global navigation.
 */
export function SiteHeader(): JSX.Element {
  return (
    <header className="sticky top-0 z-30 bg-linear-to-r from-header-start via-header-mid to-header-start text-header-text shadow-[var(--shadow-ambient)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className={cn(
            'font-serif text-lg font-semibold tracking-[var(--tracking-inscription)] text-[var(--dc-tertiary-fixed)] transition-all duration-200 hover:brightness-110'
          )}
        >
          NBA Reference
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 text-sm lg:flex">
          <Link href={'/search' as Route} className={navLinkClass}>
            Search
          </Link>
          <Link href="/players" className={navLinkClass}>
            Players
          </Link>
          <Link href="/teams" className={navLinkClass}>
            Teams
          </Link>
          <Link href="/games" className={navLinkClass}>
            Games
          </Link>
          <Link href="/seasons" className={navLinkClass}>
            Seasons
          </Link>
          <Link href="/leagues" className={navLinkClass}>
            Leagues
          </Link>
          <Link href={'/wnba' as Route} className={navLinkClass}>
            WNBA
          </Link>
          <Link href={'/gleague' as Route} className={navLinkClass}>
            G-League
          </Link>
          <Link href={'/college' as Route} className={navLinkClass}>
            College
          </Link>
          <Link href={'/international' as Route} className={navLinkClass}>
            International
          </Link>
          <Link href="/boxscores" className={navLinkClass}>
            Box Scores
          </Link>
          <Link href="/leaders" className={navLinkClass}>
            Leaders
          </Link>
          <Link href="/draft" className={navLinkClass}>
            Draft
          </Link>
          <Link href={'/allstar' as Route} className={navLinkClass}>
            All-Star
          </Link>
          <Link href={'/playoffs' as Route} className={navLinkClass}>
            Playoffs
          </Link>
          <Link href={'/awards' as Route} className={navLinkClass}>
            Awards
          </Link>
          <Link href={'/compare' as Route} className={navLinkClass}>
            Compare
          </Link>
          <Link href={'/standings' as Route} className={navLinkClass}>
            Standings
          </Link>
          <Link href={'/friv/birthdays' as Route} className={navLinkClass}>
            Frivolities
          </Link>
          <ThemeToggle />
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
