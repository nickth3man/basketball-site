/**
 * @fileoverview College basketball players directory page.
 *
 * Shows an empty state since college player data is not yet available.
 *
 * @module @/app/college/players/page
 */

import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getCollegePlayerDirectory, getCollegePlayerDirectoryCount } from '@/lib/queries';

/**
 * Renders the college basketball players directory.
 *
 * @returns The college basketball players directory page JSX element
 */
export default function CollegePlayersPage(): React.JSX.Element {
  const count = getCollegePlayerDirectoryCount();
  const players = count > 0 ? getCollegePlayerDirectory(400, 0) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted">
        <Link href={'/college' as Route} className="hover:underline">
          College
        </Link>
        {' / Players'}
      </nav>
      <h1 className="mb-3 inscription-title text-2xl">College Basketball Players</h1>
      {players.length === 0 ? (
        <div className="bg-surface-container rounded-lg border border-dashed border-muted/40 px-6 py-12 text-center">
          <p className="mb-2 text-lg font-semibold text-heading">No Players Yet</p>
          <p className="text-sm text-muted">
            College basketball player data has not been loaded yet. Data will be available once the
            ETL pipeline has been run for college basketball seasons.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">{count} players found.</p>
      )}
    </main>
  );
}
