/**
 * @fileoverview Players directory page - lists all players alphabetically.
 *
 * Displays a paginated list of NBA players with:
 * - Player name (link to detail page)
 * - Position
 * - Active/Retired status
 *
 * Players are sorted with active players first, then alphabetically.
 *
 * @module @/app/players/page
 */

import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { PaginationNav } from '@/components/pagination-nav';
import {
  getPlayerDirectory,
  getPlayerDirectoryByLetter,
  getPlayerDirectoryCount,
} from '@/lib/query/directory';
import { coercePageNumber } from '@/lib/pagination';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

/**
 * Renders the players directory page.
 *
 * Displays up to 400 players in a table with columns for Player, Pos, and Status.
 * Player names link to `/players/{bref_id}`. Position shows `-` when absent. Status shows `Active` when `is_active === 1`, otherwise `Retired`.
 *
 * @returns The page JSX containing the players table
 */
export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ letter?: string; page?: string }>;
}): Promise<React.JSX.Element> {
  const resolvedSearchParams = await searchParams;
  const requestedLetter = (resolvedSearchParams.letter ?? '').trim().toLowerCase();
  const requestedPage = coercePageNumber(resolvedSearchParams.page);
  const activeLetter = /^[a-z]$/.test(requestedLetter) ? requestedLetter : null;
  const pageSize = 100;
  const totalPlayers = getPlayerDirectoryCount(activeLetter ?? undefined);
  const totalPages = Math.max(1, Math.ceil(totalPlayers / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const players =
    activeLetter == null
      ? getPlayerDirectory(pageSize, offset)
      : getPlayerDirectoryByLetter(activeLetter, pageSize, offset);
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const summary =
    totalPlayers === 0
      ? 'No players found for this filter.'
      : `Showing ${offset + 1}-${Math.min(offset + players.length, totalPlayers)} of ${totalPlayers} players.`;
  const filterActiveClass =
    'rounded-md bg-[color-mix(in_srgb,var(--dc-tertiary-container)_20%,var(--dc-surface-container-highest))] px-2 py-1 font-semibold text-heading shadow-input';
  const filterIdleClass =
    'rounded-md bg-[var(--dc-surface-container-highest)] px-2 py-1 outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] transition-all hover:bg-button-hover';

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 inscription-title text-2xl">
        Players{activeLetter == null ? '' : ` - ${activeLetter.toUpperCase()}`}
      </h1>
      <p className="mb-4 text-sm text-muted">
        Browse the full player directory with alphabetical filtering and pagination.
      </p>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link
          href="/players"
          className={activeLetter == null ? filterActiveClass : filterIdleClass}
        >
          All
        </Link>
        {letters.map(letter => (
          <Link
            key={letter}
            href={`/players/${letter}` as Route}
            className={activeLetter === letter ? filterActiveClass : filterIdleClass}
          >
            {letter.toUpperCase()}
          </Link>
        ))}
      </div>
      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass('left')}>Player</th>
              <th className={tableHeaderCellClass('left')}>Pos</th>
              <th className={tableHeaderCellClass('left')}>Status</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.bref_id} className={tableBodyRowClass}>
                <td className={tableCellClass('left')}>
                  <Link
                    className={tableLinkClass}
                    href={
                      `/players/${player.bref_id.slice(0, 1).toLowerCase()}/${player.bref_id}` as Route
                    }
                  >
                    {player.full_name}
                  </Link>
                </td>
                <td className={tableCellClass('left')}>{player.position ?? '-'}</td>
                <td className={tableCellClass('left')}>
                  {player.is_active === 1 ? 'Active' : 'Retired'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationNav
        currentPage={currentPage}
        pathname="/players"
        query={{ letter: activeLetter ?? undefined }}
        summary={summary}
        totalPages={totalPages}
      />
    </main>
  );
}
