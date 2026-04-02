/**
 * @fileoverview G-League players directory page.
 *
 * Shows an empty state since G-League player data is not yet available.
 *
 * @module @/app/gleague/players/page
 */

import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getGLeaguePlayerDirectory, getGLeaguePlayerDirectoryCount } from '@/lib/queries';

/**
 * Renders the G-League players directory.
 *
 * @returns The G-League players directory page JSX element
 */
export default function GLeaguePlayersPage(): React.JSX.Element {
  const count = getGLeaguePlayerDirectoryCount();
  const players = count > 0 ? getGLeaguePlayerDirectory(400, 0) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted">
        <Link href={'/gleague' as Route} className="hover:underline">
          G-League
        </Link>
        {' / Players'}
      </nav>
      <h1 className="mb-3 inscription-title text-2xl">G-League Players</h1>
      {players.length === 0 ? (
        <div className="bg-surface-container rounded-lg border border-dashed border-muted/40 px-6 py-12 text-center">
          <p className="mb-2 text-lg font-semibold text-heading">No Players Yet</p>
          <p className="text-sm text-muted">
            G-League player data has not been loaded yet. Data will be available once the ETL
            pipeline has been run for G-League seasons.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">{count} players found.</p>
      )}
    </main>
  );
}
