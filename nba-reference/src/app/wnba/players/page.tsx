/**
 * @fileoverview WNBA players directory page.
 *
 * Shows an empty state since WNBA player data is not yet available.
 *
 * @module @/app/wnba/players/page
 */

import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getWnbaPlayerDirectory, getWnbaPlayerDirectoryCount } from '@/lib/queries';

/**
 * Renders the WNBA players directory.
 *
 * @returns The WNBA players directory page JSX element
 */
export default function WnbaPlayersPage(): React.JSX.Element {
  const count = getWnbaPlayerDirectoryCount();
  const players = count > 0 ? getWnbaPlayerDirectory(400, 0) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted">
        <Link href={'/wnba' as Route} className="hover:underline">
          WNBA
        </Link>
        {' / Players'}
      </nav>
      <h1 className="mb-3 inscription-title text-2xl">WNBA Players</h1>
      {players.length === 0 ? (
        <div className="bg-surface-container rounded-lg border border-dashed border-muted/40 px-6 py-12 text-center">
          <p className="mb-2 text-lg font-semibold text-heading">No Players Yet</p>
          <p className="text-sm text-muted">
            WNBA player data has not been loaded yet. Data will be available once the ETL pipeline
            has been run for WNBA seasons.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">{count} players found.</p>
      )}
    </main>
  );
}
