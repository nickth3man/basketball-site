/**
 * @fileoverview Mobile navigation hamburger menu component.
 *
 * Provides a responsive slide-out navigation panel for mobile devices.
 * Atmospheric overlay and stone-panel drawer without heavy borders.
 *
 * @module @/components/mobile-nav
 */

'use client';

import type { JSX } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface NavLink {
  href: Route;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: '/search' as Route, label: 'Search' },
  { href: '/compare' as Route, label: 'Compare' },
  { href: '/players' as Route, label: 'Players' },
  { href: '/teams' as Route, label: 'Teams' },
  { href: '/games' as Route, label: 'Games' },
  { href: '/seasons' as Route, label: 'Seasons' },
  { href: '/leagues' as Route, label: 'Leagues' },
  { href: '/wnba' as Route, label: 'WNBA' },
  { href: '/gleague' as Route, label: 'G-League' },
  { href: '/college' as Route, label: 'College' },
  { href: '/international' as Route, label: 'International' },
  { href: '/boxscores' as Route, label: 'Box Scores' },
  { href: '/leaders' as Route, label: 'Leaders' },
  { href: '/draft' as Route, label: 'Draft' },
  { href: '/allstar' as Route, label: 'All-Star' },
  { href: '/playoffs' as Route, label: 'Playoffs' },
  { href: '/awards' as Route, label: 'Awards' },
  { href: '/standings' as Route, label: 'Standings' },
  { href: '/friv/birthdays' as Route, label: 'Frivolities' },
];

function HamburgerIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const panelLinkClass =
  'block px-5 py-3.5 text-sm text-header-text transition-all duration-200 hover:bg-white/12 hover:pl-6 hover:shadow-[inset_3px_0_0_color-mix(in_srgb,var(--dc-tertiary-fixed)_55%,transparent)]';

export function MobileNav(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openMenu = useCallback((): void => {
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const handleLinkClick = useCallback((): void => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        className="flex items-center justify-center rounded-md p-2 text-header-text transition-all duration-200 hover:bg-white/10 hover:shadow-[0_0_12px_color-mix(in_srgb,var(--dc-tertiary-container)_25%,transparent)] lg:hidden"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
      >
        <HamburgerIcon className="h-5 w-5" />
      </button>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-primary/35 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {isOpen ? (
        <nav
          id="mobile-nav-panel"
          className="fixed top-0 right-0 z-50 h-full w-[min(20rem,92vw)] overflow-y-auto bg-linear-to-b from-header-start to-header-mid shadow-[var(--shadow-ambient)] outline outline-1 outline-[color-mix(in_srgb,var(--dc-tertiary-fixed)_18%,transparent)] transition-transform duration-300 ease-in-out lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-between px-4 py-4">
            <span className="font-serif text-sm font-semibold tracking-wide text-[var(--dc-tertiary-fixed)]">
              Menu
            </span>
            <button
              type="button"
              onClick={closeMenu}
              className="flex items-center justify-center rounded-md p-2 text-header-text transition-colors hover:bg-white/10"
              aria-label="Close navigation menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <ul className="flex flex-col gap-1 pb-6">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link href={link.href} onClick={handleLinkClick} className={panelLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </>
  );
}
