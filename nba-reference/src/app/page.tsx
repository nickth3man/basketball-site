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
import { Suspense } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { FavoritesWidget } from '@/components/favorites';
import { HomeExploreLinks } from '@/components/home-explore-links';
import { SearchBox } from '@/components/search-box';
import { buttonStyles } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsTable } from '@/components/stats-table';
import { StructuredData } from '@/components/structured-data';
import { getHomeSeasonId, getHomeStandings, getRecentGames } from '@/lib/query/home';
import { seasonIdToLeagueSlug } from '@/lib/season-utils';
import { getSiteUrl } from '@/lib/site-config';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

function getHomeJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NBA Reference',
    description:
      'Basketball-reference style NBA stats explorer for standings, players, teams, awards, and playoff history.',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Renders the homepage displaying the current season standings, search/export controls, and a list of recent games.
 *
 * The page includes a header with the season ID, a searchable export control row, a standings table, and a recent games table with links to box scores. Games with missing scores render a '-' in the score cells.
 *
 * @returns The homepage JSX element containing header text, controls, a standings StatsTable, and a recent games table with box score links.
 */
export default function Home(): React.JSX.Element {
  const seasonId = getHomeSeasonId();
  const leagueSlug = seasonIdToLeagueSlug(seasonId);
  const standings = getHomeStandings(30);
  const games = getRecentGames(12);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pt-4 pb-14">
      <StructuredData data={getHomeJsonLd()} />

      <section className="fresco-hero relative -mx-4 mb-10 fade-slide-in overflow-hidden px-5 py-10 sm:mx-0 sm:rounded-xl md:px-10 md:py-14">
        <h1 className="font-serif text-3xl font-semibold tracking-[var(--tracking-inscription)] sm:text-4xl">
          Basketball Stats and History
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-[color-mix(in_srgb,var(--dc-on-primary)88%,transparent)]">
          Season {seasonId} standings, scores, and player/team lookup.
        </p>
      </section>

      <div className="mb-8 grid fade-slide-in gap-4 [animation-delay:140ms] md:grid-cols-[2fr_1fr]">
        <SearchBox />
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/api/export/standings"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
          >
            Export Standings
          </Link>
          <Link
            href="/api/export/games"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
          >
            Export Games
          </Link>
        </div>
      </div>

      <FavoritesWidget />

      <HomeExploreLinks />

      {/* Standings section */}
      <Suspense fallback={<Skeleton className="mb-8 h-96 w-full" />}>
        <section className="mb-10 fade-slide-in surface-altar p-5 [animation-delay:200ms]">
          <h2 className="mb-4 inscription-title text-xl">
            {seasonId} NBA Standings
            {leagueSlug == null ? null : (
              <Link
                href={`/leagues/${leagueSlug}` as Route}
                className="ml-2 text-sm font-normal text-link hover:brightness-110"
              >
                Season Page
              </Link>
            )}
          </h2>
          <StatsTable
            columns={[
              { key: 'bref_abbrev', label: 'Team', link: { type: 'team' } },
              { key: 'w', label: 'W', align: 'right' },
              { key: 'l', label: 'L', align: 'right' },
              { key: 'n_rtg', label: 'NetRtg', align: 'right' },
              { key: 'pace', label: 'Pace', align: 'right' },
            ]}
            rows={standings}
            initialSort="w"
            tableId="home-standings"
          />
        </section>
      </Suspense>

      {/* Recent games section */}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <section className="fade-slide-in surface-altar p-5 [animation-delay:260ms]">
          <h2 className="mb-4 inscription-title text-xl">Recent Games</h2>
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
                      <Link className={tableLinkClass} href={`/boxscores/${game.game_id}` as Route}>
                        Box Score
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </Suspense>
    </main>
  );
}
