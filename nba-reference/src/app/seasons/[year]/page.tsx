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
import { StatsTable } from '@/components/stats-table';
import {
  getSeasonAwards,
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
  const awards = getSeasonAwards(year);
  const eastStandings = standings.filter(team => team['conference'] === 'East');
  const westStandings = standings.filter(team => team['conference'] === 'West');
  const standingsColumns = [
    { key: 'bref_abbrev', label: 'Team' },
    { key: 'w', label: 'W', align: 'right' as const },
    { key: 'l', label: 'L', align: 'right' as const },
    { key: 'srs', label: 'SRS', align: 'right' as const },
    { key: 'o_rtg', label: 'ORtg', align: 'right' as const },
    { key: 'd_rtg', label: 'DRtg', align: 'right' as const },
    { key: 'n_rtg', label: 'NRtg', align: 'right' as const },
    { key: 'pace', label: 'Pace', align: 'right' as const },
  ];

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

      <section className="mb-8 border border-line-mid bg-paper-soft p-3 text-sm">
        <h2 className="mb-2 text-lg font-bold">Season Awards</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs tracking-wide text-crumb uppercase">MVP</div>
            <div className="font-semibold">{awards.mvp?.full_name ?? '-'}</div>
            <div className="text-muted-strong">{awards.mvp?.team_abbrev ?? '-'}</div>
          </div>
          <div>
            <div className="text-xs tracking-wide text-crumb uppercase">DPOY</div>
            <div className="font-semibold">{awards.dpoy?.full_name ?? '-'}</div>
            <div className="text-muted-strong">{awards.dpoy?.team_abbrev ?? '-'}</div>
          </div>
          <div>
            <div className="text-xs tracking-wide text-crumb uppercase">ROY</div>
            <div className="font-semibold">{awards.roy?.full_name ?? '-'}</div>
            <div className="text-muted-strong">{awards.roy?.team_abbrev ?? '-'}</div>
          </div>
        </div>
      </section>

      {/* Standings Section */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Standings</h2>
        {eastStandings.length > 0 || westStandings.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Eastern Conference</h3>
              <StatsTable columns={standingsColumns} rows={eastStandings} initialSort="w" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Western Conference</h3>
              <StatsTable columns={standingsColumns} rows={westStandings} initialSort="w" />
            </div>
          </div>
        ) : (
          <StatsTable columns={standingsColumns} rows={standings} initialSort="w" />
        )}
      </section>

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
