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
 * - Play-by-play event stream
 *
 * @module @/app/games/[id]/page
 */

import type React from 'react';
import Link from 'next/link';
import { StatsTable } from '@/components/stats-table';
import { getGamePageData } from '@/lib/query';
import { notFound } from 'next/navigation';

/**
 * Render the game detail page for a specified game.
 *
 * Fetches game metadata, team and player box scores, advanced player stats,
 * line score by period, team four factors, and recent play-by-play events,
 * then partitions player data by home and away teams for display.
 *
 * Triggers a 404 response when the game ID is not found.
 *
 * @param params - Route params promise that resolves to an object with the `id` of the game
 * @returns The game detail page JSX element for the specified game
 */
export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pbp?: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;
  const { pbp: pbpMode } = await searchParams;
  const pbpLimit = pbpMode === 'full' ? 1000 : pbpMode === 'recent' ? 50 : 250;

  const gamePageData = getGamePageData(id, pbpLimit);
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
  } = gamePageData;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
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

      <section className="mb-6 panel-paper p-4">
        <h2 className="mb-3 text-lg font-bold text-heading">Game Navigation</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={`/boxscores/${id}` as const}
            className="rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover"
          >
            Canonical Box Score URL
          </Link>
          <Link
            href={`/games/${id}?pbp=recent` as const}
            className={
              pbpLimit === 50
                ? 'rounded border border-line bg-paper-soft px-3 py-2 font-semibold text-heading'
                : 'rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover'
            }
          >
            Recent PBP
          </Link>
          <Link
            href={`/games/${id}` as const}
            className={
              pbpLimit === 250
                ? 'rounded border border-line bg-paper-soft px-3 py-2 font-semibold text-heading'
                : 'rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover'
            }
          >
            Extended PBP
          </Link>
          <Link
            href={`/games/${id}?pbp=full` as const}
            className={
              pbpLimit === 1000
                ? 'rounded border border-line bg-paper-soft px-3 py-2 font-semibold text-heading'
                : 'rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover'
            }
          >
            Fuller PBP
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
        <h2 className="mb-2 text-xl font-bold">Play-by-Play ({playByPlay.length} events)</h2>
        <StatsTable
          columns={[
            { key: 'period', label: 'Q', align: 'right' },
            { key: 'pc_time_string', label: 'Time' },
            { key: 'visitor_description', label: `${String(game['away_abbrev'] ?? '')} Event` },
            { key: 'home_description', label: `${String(game['home_abbrev'] ?? '')} Event` },
            { key: 'score', label: 'Score' },
          ]}
          rows={playByPlay}
          initialSort="period"
        />
      </section>
    </main>
  );
}
