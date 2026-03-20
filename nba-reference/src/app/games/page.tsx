/**
 * @fileoverview Games page - displays recent game results.
 *
 * Shows a table of recent games with:
 * - Game date
 * - Away team and score
 * - Home team and score
 * - Link to box score detail page
 *
 * Displays up to 200 recent completed games.
 *
 * @module @/app/games/page
 */

import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { PaginationNav } from '@/components/pagination-nav';
import { coercePageNumber } from '@/lib/pagination';
import { getTeamDirectory } from '@/lib/query/directory';
import { getRecentGames, getRecentGamesCount } from '@/lib/query/home';
import {
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

/**
 * Render the Games page showing a table of recent completed games.
 *
 * Displays up to 200 recent games with date, away/home team abbreviations,
 * scores (shows `-` when missing), and a link to each game's box score.
 *
 * @returns The Games page JSX element containing the table of recent games
 */
export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; team?: string }>;
}): Promise<React.JSX.Element> {
  const { page, team } = await searchParams;
  const currentPage = coercePageNumber(page);
  const selectedTeam = team?.trim().toUpperCase();
  const activeTeam = /^[A-Z]{2,4}$/.test(selectedTeam ?? '') ? selectedTeam : undefined;
  const pageSize = 50;
  const totalGames = getRecentGamesCount(activeTeam);
  const totalPages = Math.max(1, Math.ceil(totalGames / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const offset = (safeCurrentPage - 1) * pageSize;
  const games = getRecentGames(pageSize, offset, activeTeam);
  const teams = getTeamDirectory();
  const summary =
    totalGames === 0
      ? 'No completed games match this filter.'
      : `Showing ${offset + 1}-${Math.min(offset + games.length, totalGames)} of ${totalGames} completed games.`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Games</h1>
      <p className="mb-4 text-sm text-muted">
        Browse recent completed games and narrow the list by team.
      </p>
      <section className="mb-4 panel-paper p-4">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/games"
            className={
              activeTeam == null
                ? 'rounded border border-line bg-paper-soft px-3 py-2 font-semibold text-heading'
                : 'rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover'
            }
          >
            All Teams
          </Link>
          {teams.map(teamOption => (
            <Link
              key={teamOption.abbreviation}
              href={`/games?team=${teamOption.abbreviation}` as Route}
              className={
                activeTeam === teamOption.abbreviation
                  ? 'rounded border border-line bg-paper-soft px-3 py-2 font-semibold text-heading'
                  : 'rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover'
              }
            >
              {teamOption.abbreviation}
            </Link>
          ))}
        </div>
      </section>
      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass('left')}>Date</th>
              <th className={tableHeaderCellClass('left')}>Away</th>
              <th className={tableHeaderCellClass('right')}>PTS</th>
              <th className={tableHeaderCellClass('left')}>Home</th>
              <th className={tableHeaderCellClass('right')}>PTS</th>
              <th className={tableHeaderCellClass('left')}>Link</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game, gameIndex) => (
              <tr key={game.game_id} className={gameIndex % 2 === 0 ? 'bg-white' : 'bg-row-alt'}>
                <td className={tableCellClass('left')}>{game.game_date}</td>
                <td className={tableCellClass('left')}>
                  <Link className={tableLinkClass} href={`/teams/${game.away_abbrev}` as Route}>
                    {game.away_abbrev}
                  </Link>
                </td>
                <td className={tableCellClass('right')}>{game.away_score ?? '-'}</td>
                <td className={tableCellClass('left')}>
                  <Link className={tableLinkClass} href={`/teams/${game.home_abbrev}` as Route}>
                    {game.home_abbrev}
                  </Link>
                </td>
                <td className={tableCellClass('right')}>{game.home_score ?? '-'}</td>
                <td className={tableCellClass('left')}>
                  <Link className={tableLinkClass} href={`/boxscores/${game.game_id}` as Route}>
                    Box
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationNav
        currentPage={safeCurrentPage}
        pathname="/games"
        query={{ team: activeTeam }}
        summary={summary}
        totalPages={totalPages}
      />
    </main>
  );
}
