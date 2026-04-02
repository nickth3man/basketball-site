/**
 * @fileoverview Game detail page - displays box score and play-by-play.
 *
 * Shows comprehensive game information:
 * - Game header (teams, date, final score)
 * - Line score by period (quarter-by-quarter scoring)
 * - Team box score totals
 * - Four Factors comparison
 * - Player box scores (home and away teams separately)
 * - Advanced player stats (eFG%, TS%, Game Score)
 * - Play-by-play event stream (text or structured shot-detail view)
 *
 * @module @/app/games/[id]/page
 */

import type React from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { StatsTable } from '@/components/stats-table';
import { StructuredData } from '@/components/structured-data';
import { COLOR_SHOT_MADE, COLOR_SHOT_MISSED } from '@/components/charts/chart-theme';
import { getGamePageData } from '@/lib/query';
import { getSiteUrl } from '@/lib/site-config';
import { notFound } from 'next/navigation';

const ShotChart = dynamic(() =>
  import('@/components/charts/shot-chart').then(m => ({ default: m.ShotChart }))
);

interface GamePageParams {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pbp?: string }>;
}

export async function generateMetadata({ params }: GamePageParams): Promise<Metadata> {
  const { id } = await params;
  const gamePageData = getGamePageData(id, 0);
  const game = gamePageData?.game;
  if (game == null) return {};

  const siteUrl = getSiteUrl();
  const away = String(game['away_abbrev'] ?? '');
  const home = String(game['home_abbrev'] ?? '');
  const date = String(game['game_date'] ?? '');
  const title = `${away} at ${home} (${date}) | NBA Reference`;
  const description = `Box score for ${away} at ${home} on ${date}. View player stats, play-by-play, and four factors.`;
  const url = `${siteUrl}/games/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
    twitter: { card: 'summary', title, description },
  };
}

function getGameJsonLd(id: string, game: Record<string, unknown>): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${String(game['away_name'])} at ${String(game['home_name'])}`,
    url: `${siteUrl}/games/${id}`,
    startDate: game['game_date'],
    sport: 'Basketball',
    competitor: [
      { '@type': 'SportsTeam', name: game['away_name'] },
      { '@type': 'SportsTeam', name: game['home_name'] },
    ],
  };
}

export default async function GamePage({
  params,
  searchParams,
}: GamePageParams): Promise<React.JSX.Element> {
  const { id } = await params;
  const { pbp: pbpMode } = await searchParams;
  const isShotDetailMode = pbpMode === 'shot-details';
  const pbpLimit = pbpMode === 'full' ? 1000 : pbpMode === 'recent' ? 50 : 250;

  const gamePageData = getGamePageData(id, pbpLimit, isShotDetailMode ? 1 : 0);
  if (gamePageData?.game == null) notFound();
  const {
    awayAdvanced,
    awayPlayers,
    awayTeam,
    box,
    fourFactors,
    game,
    homeAdvanced,
    homePlayers,
    homeTeam,
    lineScore,
    pbp: playByPlay,
    shotDetails,
  } = gamePageData;

  const navActive =
    'rounded-md px-3 py-2 font-semibold text-heading bg-[color-mix(in_srgb,var(--dc-tertiary-container)_20%,var(--dc-surface-container-highest))] shadow-input';
  const navIdle =
    'rounded-md bg-[var(--dc-surface-container-highest)] px-3 py-2 outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] transition-all hover:bg-button-hover';

  const jsonLd = getGameJsonLd(id, game);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <StructuredData data={jsonLd} />
      {/* Breadcrumb navigation */}
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/boxscores">Box Scores</Link> / {game['game_id']}
      </div>

      {/* Game header */}
      <h1 className="mb-2 text-3xl font-bold">
        {game['away_name']} at {game['home_name']}
      </h1>
      <p className="mb-4 text-sm text-muted-strong">
        {game['game_date']} | Final: {game['away_abbrev']} {game['away_score']} -{' '}
        {game['home_abbrev']} {game['home_score']}
      </p>

      <section className="mb-8 surface-altar p-5">
        <h2 className="mb-4 inscription-title text-lg">Game Navigation</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={`/boxscores/${id}` as const} className={navIdle}>
            Canonical Box Score URL
          </Link>
          <Link
            href={`/games/${id}?pbp=recent` as const}
            className={pbpLimit === 50 && !isShotDetailMode ? navActive : navIdle}
          >
            Recent PBP
          </Link>
          <Link
            href={`/games/${id}` as const}
            className={pbpLimit === 250 && !isShotDetailMode ? navActive : navIdle}
          >
            Extended PBP
          </Link>
          <Link
            href={`/games/${id}?pbp=full` as const}
            className={pbpLimit === 1000 && !isShotDetailMode ? navActive : navIdle}
          >
            Fuller PBP
          </Link>
          <Link
            href={`/games/${id}?pbp=shot-details` as const}
            className={isShotDetailMode ? navActive : navIdle}
          >
            Shot Details
          </Link>
        </div>
      </section>

      {/* Line Score by Period */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Line Score by Period</h2>
        <StatsTable
          columns={[
            { key: 'period', label: 'Period', align: 'right' },
            { key: 'away', label: String(game['away_abbrev'] ?? ''), align: 'right' },
            { key: 'home', label: String(game['home_abbrev'] ?? ''), align: 'right' },
          ]}
          rows={lineScore}
          initialSort="period"
        />
      </section>

      {/* Team Box Score */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Team Box Score</h2>
        <StatsTable
          columns={[
            { key: 'team', label: 'Team', link: { type: 'team' } },
            { key: 'fgm', label: 'FG', align: 'right' },
            { key: 'fga', label: 'FGA', align: 'right' },
            { key: 'fg3m', label: '3P', align: 'right' },
            { key: 'fg3a', label: '3PA', align: 'right' },
            { key: 'ftm', label: 'FT', align: 'right' },
            { key: 'fta', label: 'FTA', align: 'right' },
            { key: 'reb', label: 'REB', align: 'right' },
            { key: 'ast', label: 'AST', align: 'right' },
            { key: 'pts', label: 'PTS', align: 'right' },
          ]}
          rows={box}
          initialSort="pts"
        />
      </section>

      {/* Four Factors */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Four Factors</h2>
        <StatsTable
          columns={[
            { key: 'team', label: 'Team', link: { type: 'team' } },
            { key: 'efg_pct', label: 'eFG%', align: 'right' },
            { key: 'tov_pct', label: 'TOV%', align: 'right' },
            { key: 'orb_pct', label: 'ORB%', align: 'right' },
            { key: 'drb_pct', label: 'DRB%', align: 'right' },
            { key: 'ft_fga', label: 'FT/FGA', align: 'right' },
          ]}
          rows={fourFactors}
          initialSort="team"
        />
      </section>

      {/* Away Team Player Box */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{awayTeam} Player Box Score</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player', link: { type: 'player', valueKey: 'bref_id' } },
            { key: 'starter', label: 'GS', align: 'right' },
            { key: 'minutes_played', label: 'MP', align: 'right' },
            { key: 'pts', label: 'PTS', align: 'right' },
            { key: 'reb', label: 'REB', align: 'right' },
            { key: 'ast', label: 'AST', align: 'right' },
            { key: 'stl', label: 'STL', align: 'right' },
            { key: 'blk', label: 'BLK', align: 'right' },
            { key: 'plus_minus', label: '+/-', align: 'right' },
          ]}
          rows={awayPlayers.map(player => ({
            ...player,
            starter: Number(player['starter']) === 1 ? '*' : '',
          }))}
          initialSort="pts"
        />
      </section>

      {/* Home Team Player Box */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{homeTeam} Player Box Score</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player', link: { type: 'player', valueKey: 'bref_id' } },
            { key: 'starter', label: 'GS', align: 'right' },
            { key: 'minutes_played', label: 'MP', align: 'right' },
            { key: 'pts', label: 'PTS', align: 'right' },
            { key: 'reb', label: 'REB', align: 'right' },
            { key: 'ast', label: 'AST', align: 'right' },
            { key: 'stl', label: 'STL', align: 'right' },
            { key: 'blk', label: 'BLK', align: 'right' },
            { key: 'plus_minus', label: '+/-', align: 'right' },
          ]}
          rows={homePlayers.map(player => ({
            ...player,
            starter: Number(player['starter']) === 1 ? '*' : '',
          }))}
          initialSort="pts"
        />
      </section>

      {/* Away Team Advanced Box */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{awayTeam} Advanced Box</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player', link: { type: 'player', valueKey: 'bref_id' } },
            { key: 'minutes_played', label: 'MP', align: 'right' },
            { key: 'efg_pct', label: 'eFG%', align: 'right' },
            { key: 'ts_pct', label: 'TS%', align: 'right' },
            { key: 'tov_pct', label: 'TOV%', align: 'right' },
            { key: 'game_score', label: 'GmSc', align: 'right' },
          ]}
          rows={awayAdvanced}
          initialSort="game_score"
        />
      </section>

      {/* Home Team Advanced Box */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{homeTeam} Advanced Box</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player', link: { type: 'player', valueKey: 'bref_id' } },
            { key: 'minutes_played', label: 'MP', align: 'right' },
            { key: 'efg_pct', label: 'eFG%', align: 'right' },
            { key: 'ts_pct', label: 'TS%', align: 'right' },
            { key: 'tov_pct', label: 'TOV%', align: 'right' },
            { key: 'game_score', label: 'GmSc', align: 'right' },
          ]}
          rows={homeAdvanced}
          initialSort="game_score"
        />
      </section>

      {/* Play-by-Play */}
      <section>
        {isShotDetailMode ? (
          <>
            <h2 className="mb-2 text-xl font-bold">
              Shot Details ({shotDetails?.length ?? 0} field goal attempts)
            </h2>
            <p className="mb-4 text-sm text-muted-strong">
              Shot type, distance, and zone are parsed from play-by-play descriptions. Distances and
              zones are approximate — see{' '}
              <code className="text-xs">docs/data-pipeline-contract.md</code> for details.
            </p>
            <div className="mb-6 overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--dc-outline-variant)] text-left text-xs text-muted-strong uppercase">
                    <th className="py-2 pr-4">Q</th>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Player</th>
                    <th className="py-2 pr-4">Team</th>
                    <th className="py-2 pr-4">Result</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4 text-right">Dist (ft)</th>
                    <th className="py-2 pr-4">Zone</th>
                    <th className="py-2 pr-4 text-right">Pts</th>
                    <th className="py-2">AST</th>
                  </tr>
                </thead>
                <tbody>
                  {shotDetails?.map(shot => (
                    <tr
                      key={shot.event_id}
                      className="border-b border-[color-mix(in_srgb,var(--dc-outline-variant)_30%,transparent)]"
                      style={{
                        color:
                          shot.shot_result === 'made'
                            ? 'var(--heading)'
                            : 'color-mix(in srgb, var(--muted-strong) 70%, transparent)',
                      }}
                    >
                      <td className="py-1 pr-4">{shot.period}</td>
                      <td className="py-1 pr-4 tabular-nums">{shot.pc_time_string ?? '—'}</td>
                      <td className="py-1 pr-4">{shot.player_name ?? '—'}</td>
                      <td className="py-1 pr-4">{shot.team ?? '—'}</td>
                      <td
                        className="py-1 pr-4 font-semibold"
                        style={{
                          color: shot.shot_result === 'made' ? COLOR_SHOT_MADE : COLOR_SHOT_MISSED,
                        }}
                      >
                        {shot.shot_result === 'made' ? 'Made' : 'Missed'}
                      </td>
                      <td className="py-1 pr-4">{shot.shot_type ?? '—'}</td>
                      <td className="py-1 pr-4 text-right tabular-nums">
                        {shot.shot_distance ?? '—'}
                      </td>
                      <td className="py-1 pr-4">{shot.shot_zone ?? '—'}</td>
                      <td className="py-1 pr-4 text-right tabular-nums">
                        {shot.shot_result === 'made' && shot.shot_value != null
                          ? shot.shot_value
                          : '—'}
                      </td>
                      <td className="py-1">{shot.assisted ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Shot Zones</h3>
            {shotDetails && <ShotChart shots={shotDetails} height={320} />}
          </>
        ) : (
          <>
            <h2 className="mb-2 text-xl font-bold">Play-by-Play ({playByPlay.length} events)</h2>
            <StatsTable
              columns={[
                { key: 'period', label: 'Q', align: 'right' },
                { key: 'pc_time_string', label: 'Time' },
                {
                  key: 'visitor_description',
                  label: `${String(game['away_abbrev'] ?? '')} Event`,
                },
                { key: 'home_description', label: `${String(game['home_abbrev'] ?? '')} Event` },
                { key: 'score', label: 'Score' },
              ]}
              rows={playByPlay}
              initialSort="period"
            />
          </>
        )}
      </section>
    </main>
  );
}
