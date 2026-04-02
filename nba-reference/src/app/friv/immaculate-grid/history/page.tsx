/**
 * @fileoverview Immaculate Grid history page.
 *
 * Lists all past puzzles with their criteria, allowing players to revisit
 * previous days' challenges.
 *
 * @module @/app/friv/immaculate-grid/history/page
 */

import type React from 'react';
import type { Metadata } from 'next';
import type { Route } from 'next';
import Link from 'next/link';
import { getAvailablePuzzles } from '@/lib/puzzles/data';
import type { GridCriteria } from '@/lib/puzzles/types';

export const metadata: Metadata = {
  title: 'Immaculate Grid History | NBA Reference',
  description: 'Browse all past Immaculate Grid basketball trivia puzzles.',
};

/** Returns today's ET date as a YYYY-MM-DD string */
function getTodayDateET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).slice(0, 10);
}

/** Human-readable description of a single criterion */
function criteriaDescription(c: GridCriteria): string {
  return c.label;
}

/**
 * Immaculate Grid history page.
 *
 * Shows all available puzzles sorted newest-first.
 */
export default function ImmaculateGridHistoryPage(): React.JSX.Element {
  const today = getTodayDateET();
  const puzzles = getAvailablePuzzles(today);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h1 className="inscription-title text-3xl">Grid History</h1>
        <Link
          href={'/friv/immaculate-grid' as Route}
          className="text-xs text-muted underline-offset-2 hover:underline"
        >
          ← Today&apos;s puzzle
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        All past Immaculate Grid puzzles. Click a date to play that day&apos;s challenge.
      </p>

      {puzzles.length === 0 ? (
        <div className="surface-altar p-8 text-center text-muted">
          <p className="text-sm">No past puzzles yet. Check back tomorrow!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {puzzles.map(puzzle => (
            <Link
              key={puzzle.puzzleId}
              href={`/friv/immaculate-grid?date=${puzzle.date}` as Route}
              className="block panel-paper p-4 transition-shadow hover:shadow-[var(--shadow-glow-gold)]"
              aria-label={`Puzzle from ${puzzle.date}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs editorial-kicker">{puzzle.date}</span>
                {puzzle.date === today && <span className="stat-coin text-xs">Today</span>}
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
                    Rows
                  </p>
                  <ul className="space-y-0.5">
                    {puzzle.rows.map((row, i) => (
                      <li key={i} className="text-sm text-ink">
                        {criteriaDescription(row)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
                    Columns
                  </p>
                  <ul className="space-y-0.5">
                    {puzzle.cols.map((col, i) => (
                      <li key={i} className="text-sm text-ink">
                        {criteriaDescription(col)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
