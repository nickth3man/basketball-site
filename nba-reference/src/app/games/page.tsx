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

import Link from 'next/link';
import { getRecentGames } from '@/lib/query/home';
import {
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

/**
 * Render the Games page showing recent completed games in a table.
 *
 * Fetches up to 200 recent games and lists each game's date, away/home teams,
 * scores (or "-" when missing), and a link to the game's box score.
 *
 * @returns The Games page JSX element containing the table of recent games
 */
export default function GamesPage() {
  const games = getRecentGames(200);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Games</h1>
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
            {games.map((g, i) => (
              <tr key={g.game_id} className={i % 2 === 0 ? 'bg-white' : 'bg-row-alt'}>
                <td className={tableCellClass('left')}>{g.game_date}</td>
                <td className={tableCellClass('left')}>{g.away_abbrev}</td>
                <td className={tableCellClass('right')}>{g.away_score ?? '-'}</td>
                <td className={tableCellClass('left')}>{g.home_abbrev}</td>
                <td className={tableCellClass('right')}>{g.home_score ?? '-'}</td>
                <td className={tableCellClass('left')}>
                  <Link className={tableLinkClass} href={`/games/${g.game_id}`}>
                    Box
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
