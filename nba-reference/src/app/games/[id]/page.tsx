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

import Link from 'next/link';
import { StatsTable } from '@/components/stats-table';
import {
  getGameById,
  getGameLineScore,
  getGamePlayerAdvancedBox,
  getGamePbpEvents,
  getGamePlayerBox,
  getGameTeamFourFactors,
  getTeamGameBox,
} from '@/lib/queries';
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
export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Primary game lookup - 404 if not found
  const game = getGameById(id);
  if (!game) notFound();

  // Fetch all game data in parallel
  const box = getTeamGameBox(id);
  const players = getGamePlayerBox(id);
  const playerAdvanced = getGamePlayerAdvancedBox(id);
  const lineScore = getGameLineScore(id);
  const fourFactors = getGameTeamFourFactors(id);
  const pbp = getGamePbpEvents(id, 50);

  // Separate players by team for display
  const awayTeam = String(game.away_abbrev ?? '');
  const homeTeam = String(game.home_abbrev ?? '');
  const awayPlayers = players.filter(p => String(p.team) === awayTeam);
  const homePlayers = players.filter(p => String(p.team) === homeTeam);
  const awayAdvanced = playerAdvanced.filter(p => String(p.team) === awayTeam);
  const homeAdvanced = playerAdvanced.filter(p => String(p.team) === homeTeam);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb navigation */}
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/games">Games</Link> / {game.game_id}
      </div>

      {/* Game header */}
      <h1 className="mb-2 text-3xl font-bold">
        {game.away_name} at {game.home_name}
      </h1>
      <p className="mb-4 text-sm text-muted-strong">
        {game.game_date} | Final: {game.away_abbrev} {game.away_score} - {game.home_abbrev}{' '}
        {game.home_score}
      </p>

      {/* Line Score by Period */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Line Score by Period</h2>
        <StatsTable
          columns={[
            { key: 'period', label: 'Period', align: 'right' },
            { key: 'away', label: `${game.away_abbrev}`, align: 'right' },
            { key: 'home', label: `${game.home_abbrev}`, align: 'right' },
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
            { key: 'team', label: 'Team' },
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
            { key: 'team', label: 'Team' },
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
            { key: 'full_name', label: 'Player' },
            { key: 'starter', label: 'GS', align: 'right' },
            { key: 'minutes_played', label: 'MP', align: 'right' },
            { key: 'pts', label: 'PTS', align: 'right' },
            { key: 'reb', label: 'REB', align: 'right' },
            { key: 'ast', label: 'AST', align: 'right' },
            { key: 'stl', label: 'STL', align: 'right' },
            { key: 'blk', label: 'BLK', align: 'right' },
            { key: 'plus_minus', label: '+/-', align: 'right' },
          ]}
          rows={awayPlayers.map(p => ({
            ...p,
            starter: Number(p.starter) === 1 ? '*' : '',
          }))}
          initialSort="pts"
        />
      </section>

      {/* Home Team Player Box */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{homeTeam} Player Box Score</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'starter', label: 'GS', align: 'right' },
            { key: 'minutes_played', label: 'MP', align: 'right' },
            { key: 'pts', label: 'PTS', align: 'right' },
            { key: 'reb', label: 'REB', align: 'right' },
            { key: 'ast', label: 'AST', align: 'right' },
            { key: 'stl', label: 'STL', align: 'right' },
            { key: 'blk', label: 'BLK', align: 'right' },
            { key: 'plus_minus', label: '+/-', align: 'right' },
          ]}
          rows={homePlayers.map(p => ({
            ...p,
            starter: Number(p.starter) === 1 ? '*' : '',
          }))}
          initialSort="pts"
        />
      </section>

      {/* Away Team Advanced Box */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{awayTeam} Advanced Box</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
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
            { key: 'full_name', label: 'Player' },
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
        <h2 className="mb-2 text-xl font-bold">Play-by-Play (Recent)</h2>
        <StatsTable
          columns={[
            { key: 'period', label: 'Q', align: 'right' },
            { key: 'pc_time_string', label: 'Time' },
            { key: 'visitor_description', label: `${game.away_abbrev} Event` },
            { key: 'home_description', label: `${game.home_abbrev} Event` },
            { key: 'score', label: 'Score' },
          ]}
          rows={pbp}
          initialSort="period"
        />
      </section>
    </main>
  );
}
