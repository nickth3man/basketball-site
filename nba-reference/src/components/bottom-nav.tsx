/**
 * @fileoverview Mobile bottom navigation bar component.
 *
 * Renders a fixed bottom navigation bar visible only on mobile devices
 * (below the `lg` breakpoint). Provides one-tap access to the four most
 * important destinations: Home, Standings, Leaders, and Search.
 *
 * Design: lapis lazuli (#00245e) background, gold accent for the active
 * destination — consistent with the Digital Cathedral palette.
 *
 * @module @/components/bottom-nav
 */

'use client';

import type { JSX } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BottomNavItem {
  href: Route;
  label: string;
  icon: JSX.Element;
}

function HomeIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function StandingsIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function LeadersIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function SearchIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const NAV_ITEMS: BottomNavItem[] = [
  { href: '/' as Route, label: 'Home', icon: <HomeIcon /> },
  { href: '/standings' as Route, label: 'Standings', icon: <StandingsIcon /> },
  { href: '/leaders' as Route, label: 'Leaders', icon: <LeadersIcon /> },
  { href: '/search' as Route, label: 'Search', icon: <SearchIcon /> },
];

/**
 * Fixed bottom navigation bar for mobile devices.
 *
 * Hidden on `lg` and wider viewports where the top header navigation is used.
 * Each item has a minimum touch target of 44×44 px.
 *
 * @returns The bottom navigation bar element
 */
export function BottomNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed right-0 bottom-0 left-0 z-30 flex h-16 items-stretch bg-[var(--dc-primary)] pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_12px_rgb(0_0_0/0.18)] lg:hidden"
    >
      {NAV_ITEMS.map(item => {
        const href = item.href as string;
        const isActive = pathname === href || pathname.startsWith(href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-sm transition-colors duration-150',
              isActive
                ? 'text-[var(--dc-tertiary-fixed)]'
                : 'text-[var(--dc-on-primary)]/70 hover:text-[var(--dc-on-primary)]'
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center transition-transform duration-150',
                isActive && 'scale-110'
              )}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
