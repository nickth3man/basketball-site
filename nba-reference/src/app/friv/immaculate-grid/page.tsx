/**
 * @fileoverview Immaculate Grid game page.
 *
 * Serves today's puzzle for the Immaculate Grid basketball trivia game.
 * The puzzle is loaded server-side and the interactive grid is rendered
 * by the client component `GridGame`.
 *
 * @module @/app/friv/immaculate-grid/page
 */

import type React from 'react';
import type { Metadata } from 'next';
import type { Route } from 'next';
import Link from 'next/link';
import { GridGame } from './GridGame';
import { getTodayPuzzle } from '@/lib/puzzles/data';

export const metadata: Metadata = {
  title: 'Immaculate Grid | NBA Reference',
  description:
    'A daily basketball trivia game. Fill the 3×3 grid with NBA players who satisfy both the row and column criteria.',
};

/** Returns today's ET date as a YYYY-MM-DD string */
function getTodayDateET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).slice(0, 10);
}

/**
 * Immaculate Grid game page.
 *
 * Loads today's puzzle on the server and renders the interactive grid.
 * Falls back to an unavailable message when no puzzle exists for today.
 */
export default function ImmaculateGridPage(): React.JSX.Element {
  const today = getTodayDateET();
  const puzzle = getTodayPuzzle(today);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h1 className="inscription-title text-3xl">Immaculate Grid</h1>
        <Link
          href={'/friv/immaculate-grid/history' as Route}
          className="text-xs text-muted underline-offset-2 hover:underline"
        >
          Past puzzles
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Fill the 3×3 grid with NBA players who satisfy <em>both</em> the row and column criteria for
        each cell. One new puzzle every day.
      </p>

      {puzzle === undefined ? (
        <div className="surface-altar p-8 text-center text-muted">
          <p className="text-lg font-semibold text-heading">No puzzle available today.</p>
          <p className="mt-2 text-sm">Check back tomorrow for a new puzzle.</p>
        </div>
      ) : (
        <GridGame puzzle={puzzle} />
      )}

      <p className="mt-8 text-center text-xs text-muted">
        New puzzle drops at midnight ET · {today}
      </p>
    </main>
  );
}
