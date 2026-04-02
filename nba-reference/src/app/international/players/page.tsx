/**
 * @fileoverview International basketball players directory page.
 *
 * Shows an empty state since international player data is not yet available.
 *
 * @module @/app/international/players/page
 */

import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import {
  getInternationalPlayerDirectory,
  getInternationalPlayerDirectoryCount,
} from '@/lib/queries';

/**
 * Renders the international basketball players directory.
 *
 * @returns The international players directory page JSX element
 */
export default function InternationalPlayersPage(): React.JSX.Element {
  const count = getInternationalPlayerDirectoryCount();
  const players = count > 0 ? getInternationalPlayerDirectory(400, 0) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted">
        <Link href={'/international' as Route} className="hover:underline">
          International
        </Link>
        {' / Players'}
      </nav>
      <h1 className="mb-3 inscription-title text-2xl">International Players</h1>
      {players.length === 0 ? (
        <div className="bg-surface-container rounded-lg border border-dashed border-muted/40 px-6 py-12 text-center">
          <p className="mb-2 text-lg font-semibold text-heading">No Players Yet</p>
          <p className="text-sm text-muted">
            International basketball player data has not been loaded yet. Data will be available
            once the ETL pipeline has been run for international seasons.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">{count} players found.</p>
      )}
    </main>
  );
}
