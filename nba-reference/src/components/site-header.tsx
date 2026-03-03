/**
 * @fileoverview Global site header with navigation.
 * 
 * Provides the main navigation header displayed on all pages.
 * Uses sticky positioning to remain visible during scroll.
 * Includes gradient background and animated link hover effects.
 * 
 * @module @/components/site-header
 */

import Link from "next/link";

/**
 * Site header component with main navigation.
 * 
 * Features:
 * - Sticky positioning at top of viewport
 * - Gradient background (header-start → header-mid → header-start)
 * - Navigation links: Players, Teams, Games, Seasons
 * - Hover effects on links
 * - Responsive layout with max-width container
 * 
 * @returns React component for the site header
 * @example
 * ```tsx
 * // Used in root layout
 * <html>
 *   <body>
 *     <SiteHeader />
 *     {children}
 *   </body>
 * </html>
 * ```
 */
export function SiteHeader() {
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
          <Link
            href="/players"
            className="transition-colors duration-200 hover:text-white"
          >
            Players
          </Link>
          <Link
            href="/teams"
            className="transition-colors duration-200 hover:text-white"
          >
            Teams
          </Link>
          <Link
            href="/games"
            className="transition-colors duration-200 hover:text-white"
          >
            Games
          </Link>
          <Link
            href="/seasons"
            className="transition-colors duration-200 hover:text-white"
          >
            Seasons
          </Link>
        </nav>
      </div>
    </header>
  );
}
