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
import { getPlayerDirectoryByLetter } from '@/lib/query/directory';
import { routes } from '@/lib/routes';
import {
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
}: PlayerLetterPageProps): Promise<React.JSX.Element> {
  const { letter } = await params;
  const normalizedLetter = letter.trim().toLowerCase();

  // Validate letter is a single lowercase a-z character
  if (!/^[a-z]$/.test(normalizedLetter)) {
    notFound();
  }

  const players = getPlayerDirectoryByLetter(normalizedLetter, 400);
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Players - {normalizedLetter.toUpperCase()}</h1>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link href="/players" className="rounded border border-line px-2 py-1 hover:bg-button-bg">
          All
        </Link>
        {letters.map(l => (
          <Link
            key={l}
            href={routes.playerLetter(l)}
            className={
              normalizedLetter === l
                ? 'rounded border border-line bg-button-bg px-2 py-1 font-semibold'
                : 'rounded border border-line px-2 py-1 hover:bg-button-bg'
            }
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
            {players.map((player, playerIndex) => (
              <tr
                key={player.bref_id}
                className={playerIndex % 2 === 0 ? 'bg-white' : 'bg-row-alt'}
              >
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
    </main>
  );
}
