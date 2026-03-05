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
import { getPlayerDirectory, getPlayerDirectoryByLetter } from '@/lib/query/directory';
import {
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
  searchParams: Promise<{ letter?: string }>;
}): Promise<React.JSX.Element> {
  const resolvedSearchParams = await searchParams;
  const requestedLetter = (resolvedSearchParams.letter ?? '').trim().toLowerCase();
  const activeLetter = /^[a-z]$/.test(requestedLetter) ? requestedLetter : null;
  const players =
    activeLetter == null ? getPlayerDirectory(400) : getPlayerDirectoryByLetter(activeLetter, 400);
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">
        Players{activeLetter == null ? '' : ` - ${activeLetter.toUpperCase()}`}
      </h1>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link
          href="/players"
          className={
            activeLetter == null
              ? 'rounded border border-line bg-button-bg px-2 py-1 font-semibold'
              : 'rounded border border-line px-2 py-1 hover:bg-button-bg'
          }
        >
          All
        </Link>
        {letters.map(letter => (
          <Link
            key={letter}
            href={`/players/${letter}` as Route}
            className={
              activeLetter === letter
                ? 'rounded border border-line bg-button-bg px-2 py-1 font-semibold'
                : 'rounded border border-line px-2 py-1 hover:bg-button-bg'
            }
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
            {players.map((player, playerIndex) => (
              <tr
                key={player.bref_id}
                className={playerIndex % 2 === 0 ? 'bg-white' : 'bg-row-alt'}
              >
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
    </main>
  );
}
