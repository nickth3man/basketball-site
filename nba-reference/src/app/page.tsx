/**
 * @fileoverview Homepage component - displays standings and recent games.
 *
 * The main landing page showing:
 * - Site title and description
 * - Search box for players/teams
 * - Export buttons for standings and games data
 * - Current season standings table
 * - Recent games list
 *
 * Data is fetched server-side using cached queries for optimal performance.
 *
 * @module @/app/page
 */

import type React from 'react';
import Link from 'next/link';
import { SearchBox } from '@/components/search-box';
import { StatsTable } from '@/components/stats-table';
import { getHomeSeasonId, getHomeStandings, getRecentGames } from '@/lib/query/home';
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
 * Render the homepage showing the current season standings and recent games.
 *
 * Fetches the latest season ID, the top 30 team standings, and the 12 most recent completed games, then renders the page header, search/export controls, a standings table, and a recent games table.
 *
 * @returns The homepage JSX element containing header text, controls, a standings StatsTable, and a recent games table with box score links.
 */
export default function Home(): React.JSX.Element {
  const seasonId = getHomeSeasonId();
  const standings = getHomeStandings(30);
  const games = getRecentGames(12);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      {/* Page header */}
      <h1 className="mb-1 fade-slide-in text-3xl font-bold text-heading">
        Basketball Stats and History
      </h1>
      <p className="mb-5 fade-slide-in text-sm text-muted [animation-delay:80ms]">
        Season {seasonId} standings, scores, and player/team lookup.
      </p>

      {/* Search and export controls */}
      <div className="mb-6 grid fade-slide-in gap-3 [animation-delay:140ms] md:grid-cols-[2fr_1fr]">
        <SearchBox />
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/api/export/standings"
            className="rounded border border-line bg-button-bg px-2 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-button-hover active:translate-y-0 active:scale-[0.98]"
          >
            Export Standings
          </Link>
          <Link
            href="/api/export/games"
            className="rounded border border-line bg-button-bg px-2 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-button-hover active:translate-y-0 active:scale-[0.98]"
          >
            Export Games
          </Link>
        </div>
      </div>

      {/* Standings section */}
      <section className="mb-8 fade-slide-in panel-paper p-3 [animation-delay:200ms]">
        <h2 className="mb-2 text-xl font-bold text-heading">{seasonId} NBA Standings</h2>
        <StatsTable
          columns={[
            { key: 'bref_abbrev', label: 'Team' },
            { key: 'w', label: 'W', align: 'right' },
            { key: 'l', label: 'L', align: 'right' },
            { key: 'n_rtg', label: 'NetRtg', align: 'right' },
            { key: 'pace', label: 'Pace', align: 'right' },
          ]}
          rows={standings}
          initialSort="w"
        />
      </section>

      {/* Recent games section */}
      <section className="fade-slide-in panel-paper p-3 [animation-delay:260ms]">
        <h2 className="mb-2 text-xl font-bold text-heading">Recent Games</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                {['Date', 'Away', 'Away PTS', 'Home', 'Home PTS', 'Box Score'].map(header => (
                  <th key={header} className={tableHeaderCellClass('left')}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.map(game => (
                <tr key={game.game_id} className={tableBodyRowClass}>
                  <td className={tableCellClass('left')}>{game.game_date}</td>
                  <td className={tableCellClass('left')}>{game.away_abbrev}</td>
                  <td className={tableCellClass('right')}>{game.away_score ?? '-'}</td>
                  <td className={tableCellClass('left')}>{game.home_abbrev}</td>
                  <td className={tableCellClass('right')}>{game.home_score ?? '-'}</td>
                  <td className={tableCellClass('left')}>
                    <Link className={tableLinkClass} href={`/games/${game.game_id}`}>
                      Box Score
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
