/**
 * @fileoverview Mobile navigation hamburger menu component.
 *
 * Provides a responsive slide-out navigation panel for mobile devices.
 * Hidden on lg+ breakpoints where the desktop navigation is visible.
 *
 * @module @/components/mobile-nav
 */

'use client';

import type { JSX } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Navigation link configuration for mobile menu.
 */
interface NavLink {
  href: Route;
  label: string;
}

/**
 * All navigation links displayed in the mobile menu.
 */
const NAV_LINKS: NavLink[] = [
  { href: '/search' as Route, label: 'Search' },
  { href: '/players' as Route, label: 'Players' },
  { href: '/teams' as Route, label: 'Teams' },
  { href: '/games' as Route, label: 'Games' },
  { href: '/seasons' as Route, label: 'Seasons' },
  { href: '/leagues' as Route, label: 'Leagues' },
  { href: '/boxscores' as Route, label: 'Box Scores' },
  { href: '/leaders' as Route, label: 'Leaders' },
  { href: '/draft' as Route, label: 'Draft' },
  { href: '/allstar' as Route, label: 'All-Star' },
  { href: '/playoffs' as Route, label: 'Playoffs' },
  { href: '/awards' as Route, label: 'Awards' },
  { href: '/standings' as Route, label: 'Standings' },
  { href: '/friv/birthdays' as Route, label: 'Frivolities' },
];

/**
 * Renders a hamburger menu icon (three horizontal lines).
 *
 * @param className - Optional additional CSS classes
 * @returns SVG hamburger icon element
 */
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

/**
 * Renders a close (X) icon.
 *
 * @param className - Optional additional CSS classes
 * @returns SVG close icon element
 */
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

/**
 * Renders the mobile navigation hamburger menu.
 *
 * Shows a hamburger button on screens smaller than lg breakpoint.
 * When opened, displays a slide-out panel from the right with all navigation links.
 * Includes an overlay backdrop that closes the menu when clicked.
 *
 * @returns The mobile navigation component
 */
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
      {/* Hamburger button - visible on mobile, hidden on lg+ */}
      <button
        type="button"
        onClick={openMenu}
        className="flex items-center justify-center rounded p-2 text-header-text transition-colors hover:bg-header-mid lg:hidden"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
      >
        <HamburgerIcon className="h-5 w-5" />
      </button>

      {/* Overlay backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <nav
        id="mobile-nav-panel"
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-64 transform border-l border-line bg-header-start shadow-xl transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
      >
        {/* Panel header with close button */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold text-header-text">Menu</span>
          <button
            type="button"
            onClick={closeMenu}
            className="flex items-center justify-center rounded p-2 text-header-text transition-colors hover:bg-header-mid"
            aria-label="Close navigation menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <ul className="flex flex-col py-2">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={handleLinkClick}
                className="block px-4 py-3 text-sm text-header-text transition-colors hover:bg-header-mid hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
