/**
 * @fileoverview Player letter index page - shows players starting with a specific letter.
 *
 * Displays a paginated list of NBA players whose bref_id starts with the given letter.
 * Player names link to their detail page at `/players/[letter]/[id]`.
 *
 * @module @/app/players/[letter]/page
 */

import type React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PaginationNav } from '@/components/pagination-nav';
import { coercePageNumber } from '@/lib/pagination';
import { getPlayerDirectoryByLetter, getPlayerDirectoryCount } from '@/lib/query/directory';
import { routes } from '@/lib/routes';
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
 * Props for the PlayerLetterPage component.
 */
interface PlayerLetterPageProps {
  /** Route parameters containing the letter */
  params: Promise<{ letter: string }>;
  searchParams: Promise<{ page?: string }>;
}

/**
 * Renders the player letter index page.
 *
 * Displays players whose bref_id starts with the given letter in a table
 * with columns for Player, Pos, and Status.
 *
 * @param props - The page props containing route parameters
 * @returns The page JSX containing the players table
 */
export default async function PlayerLetterPage({
  params,
  searchParams,
}: PlayerLetterPageProps): Promise<React.JSX.Element> {
  const { letter } = await params;
  const resolvedSearchParams = await searchParams;
  const normalizedLetter = letter.trim().toLowerCase();

  // Validate letter is a single lowercase a-z character
  if (!/^[a-z]$/.test(normalizedLetter)) {
    notFound();
  }

  const requestedPage = coercePageNumber(resolvedSearchParams.page);
  const pageSize = 100;
  const totalPlayers = getPlayerDirectoryCount(normalizedLetter);
  const totalPages = Math.max(1, Math.ceil(totalPlayers / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const players = getPlayerDirectoryByLetter(normalizedLetter, pageSize, offset);
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const summary =
    totalPlayers === 0
      ? 'No players found for this letter.'
      : `Showing ${offset + 1}-${Math.min(offset + players.length, totalPlayers)} of ${totalPlayers} players.`;
  const filterActiveClass =
    'rounded-md bg-[color-mix(in_srgb,var(--dc-tertiary-container)_20%,var(--dc-surface-container-highest))] px-2 py-1 font-semibold text-heading shadow-input';
  const filterIdleClass =
    'rounded-md bg-[var(--dc-surface-container-highest)] px-2 py-1 outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] transition-all hover:bg-button-hover';

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 inscription-title text-2xl">
        Players - {normalizedLetter.toUpperCase()}
      </h1>
      <p className="mb-4 text-sm text-muted">
        Browse the full player directory for this letter with paginated results.
      </p>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link href="/players" className={filterIdleClass}>
          All
        </Link>
        {letters.map(l => (
          <Link
            key={l}
            href={routes.playerLetter(l)}
            className={normalizedLetter === l ? filterActiveClass : filterIdleClass}
          >
            {l.toUpperCase()}
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
                    href={routes.player(player.bref_id.slice(0, 1).toLowerCase(), player.bref_id)}
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
        pathname={routes.playerLetter(normalizedLetter)}
        summary={summary}
        totalPages={totalPages}
      />
    </main>
  );
}
