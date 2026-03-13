/**
 * @fileoverview Season detail page - displays season statistics and leaders.
 *
 * Shows comprehensive season information:
 * - League summary (league-wide averages)
 * - Team standings with key metrics
 * - Statistical leaders (scoring, rebounding, assists)
 * - Recent games from the season
 *
 * Returns 404 if season has no standings data (indicating invalid season ID).
 *
 * @module @/app/seasons/[year]/page
 */

import type React from 'react';
import Link from 'next/link';
import { SeasonAwardsSummary } from '@/components/season-awards-summary';
import { SeasonStandingsSection } from '@/components/season-standings-section';
import { StatsTable } from '@/components/stats-table';
import {
  getDPOYWinner,
  getMVPWinner,
  getROYWinner,
  getSeasonAssistLeaders,
  getSeasonLeagueSummary,
  getSeasonRecentGames,
  getSeasonReboundLeaders,
  getSeasonScoringLeaders,
  getSeasonStandings,
} from '@/lib/queries';
import { notFound } from 'next/navigation';

/**
 * Render the season detail page for the specified year.
 *
 * If the season has no standings data, a 404 page is triggered.
 *
 * @param params - Promise resolving to route parameters containing the `year` string
 * @returns The season detail page JSX element
 */
export default async function SeasonPage({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<React.JSX.Element> {
  const { year } = await params;

  // Primary standings lookup - 404 if no data (invalid season)
  const standings = getSeasonStandings(year);
  if (standings.length === 0) notFound();

  // Fetch additional season data in parallel
  const leaders = getSeasonScoringLeaders(year, 30);
  const reboundLeaders = getSeasonReboundLeaders(year, 30);
  const assistLeaders = getSeasonAssistLeaders(year, 30);
  const leagueSummary = getSeasonLeagueSummary(year);
  const games = getSeasonRecentGames(year, 50);
  const mvp = getMVPWinner(year);
  const dpoy = getDPOYWinner(year);
  const roy = getROYWinner(year);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb navigation */}
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/seasons">Seasons</Link> / {year}
      </div>
      <h1 className="mb-3 text-3xl font-bold">{year} NBA Season</h1>

      {/* League Summary Section */}
      <section className="mb-8 border border-line-mid bg-paper-soft p-3 text-sm">
        <h2 className="mb-2 text-lg font-bold">League Summary</h2>
        <div className="grid gap-2 sm:grid-cols-5">
          <div>
            PPG: <span className="font-bold tabular-nums">{leagueSummary['ppg'] ?? '-'}</span>
          </div>
          <div>
            RPG: <span className="font-bold tabular-nums">{leagueSummary['rpg'] ?? '-'}</span>
          </div>
          <div>
            APG: <span className="font-bold tabular-nums">{leagueSummary['apg'] ?? '-'}</span>
          </div>
          <div>
            eFG%: <span className="font-bold tabular-nums">{leagueSummary['efg_pct'] ?? '-'}</span>
          </div>
          <div>
            TS%: <span className="font-bold tabular-nums">{leagueSummary['ts_pct'] ?? '-'}</span>
          </div>
        </div>
      </section>

      <SeasonAwardsSummary mvp={mvp} dpoy={dpoy} roy={roy} />
      <SeasonStandingsSection standings={standings} />

      {/* Scoring Leaders Section */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Scoring Leaders</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'team', label: 'Tm' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'pts_pg', label: 'PTS', align: 'right' },
            { key: 'pts', label: 'Total PTS', align: 'right' },
          ]}
          rows={leaders}
          initialSort="pts_pg"
        />
      </section>

      {/* Rebound Leaders Section */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Rebound Leaders</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'team', label: 'Tm' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'reb_pg', label: 'REB', align: 'right' },
            { key: 'reb', label: 'Total REB', align: 'right' },
          ]}
          rows={reboundLeaders}
          initialSort="reb_pg"
        />
      </section>

      {/* Assist Leaders Section */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Assist Leaders</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'team', label: 'Tm' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'ast_pg', label: 'AST', align: 'right' },
            { key: 'ast', label: 'Total AST', align: 'right' },
          ]}
          rows={assistLeaders}
          initialSort="ast_pg"
        />
      </section>

      {/* Recent Games Section */}
      <section>
        <h2 className="mb-2 text-xl font-bold">Recent Games</h2>
        <StatsTable
          columns={[
            { key: 'game_date', label: 'Date' },
            { key: 'away_abbrev', label: 'Away' },
            { key: 'away_score', label: 'Away PTS', align: 'right' },
            { key: 'home_abbrev', label: 'Home' },
            { key: 'home_score', label: 'Home PTS', align: 'right' },
            { key: 'game_id', label: 'Game ID' },
          ]}
          rows={games}
          initialSort="game_date"
        />
      </section>
    </main>
  );
}
