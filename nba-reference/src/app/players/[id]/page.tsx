/**
 * @fileoverview Player detail page - comprehensive player statistics dashboard.
 *
 * This is the most complex page in the application, displaying 14+ data sections:
 * - Player bio (photo, position, birth info, draft, etc.)
 * - Career summary stats card
 * - Awards and honors
 * - Per-game, per-36, per-100 possession stats
 * - Season totals and advanced metrics
 * - Shooting breakdowns (distance, zones, assisted %)
 * - Adjusted shooting (league-relative metrics)
 * - Play-by-play derived stats (position estimates)
 * - Full game log with Game Score
 * - Awards history
 * - Salary history
 * - Career game highs
 *
 * Data is fetched server-side in parallel for optimal performance.
 * Uses sticky navigation sidebar for section jumping.
 *
 * @module @/app/players/[id]/page
 */

import type React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StatsTable } from '@/components/stats-table';
import {
  getPlayerAdjustedShootingStats,
  getPlayerAdvancedSeasonStats,
  getPlayerAwards,
  getPlayerByBrefId,
  getPlayerCareerSummary,
  getPlayerFullGameLog,
  getPlayerGameHighs,
  getPlayerPer100Stats,
  getPlayerPerGameStats,
  getPlayerSalaries,
  getPlayerSeasonStats,
  getPlayerShootingSeasonStats,
  getPlayerPbpSeasonStats,
  getPlayerPer36Stats,
} from '@/lib/queries';
import { formatPercentage, formatUsd } from '@/lib/formatters';
import { notFound } from 'next/navigation';
import { validateBrefId } from '@/lib/validation';

/**
 * Render the player detail page showing a comprehensive dashboard of a player's biography, season and per-game statistics, shooting and advanced metrics, play-by-play derived stats, game log, awards, salary history, career summary, and game highs.
 *
 * Triggers a 404 (via notFound) when the requested player cannot be found.
 *
 * @param params - Promise resolving to route params containing the player's bref `id`
 * @returns The rendered player detail page JSX
 */
export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;

  // Validate the player ID format before querying
  validateBrefId(id);

  // Primary player lookup - 404 if not found
  const player = getPlayerByBrefId(id);
  if (!player) notFound();

  // Fetch all player statistics in parallel
  // Each query is cached (30s TTL) for subsequent page loads
  const perGameStats = getPlayerPerGameStats(id, 25);
  const per36Stats = getPlayerPer36Stats(id, 25);
  const per100Stats = getPlayerPer100Stats(id, 25);
  const seasonStats = getPlayerSeasonStats(id, 25);
  const advancedStats = getPlayerAdvancedSeasonStats(id, 25);
  const shootingStats = getPlayerShootingSeasonStats(id, 25);
  const adjustedShootingStats = getPlayerAdjustedShootingStats(id, 25);
  const pbpStats = getPlayerPbpSeasonStats(id, 25);
  const fullGameLog = getPlayerFullGameLog(player.player_id, 100);
  const awards = getPlayerAwards(player.player_id, 100);
  const salaries = getPlayerSalaries(player.player_id, 30);
  const summary = getPlayerCareerSummary(id);
  const highs = getPlayerGameHighs(player.player_id);

  // Aggregate awards by name for display badges
  const awardCounts = Object.entries(
    awards.reduce<Record<string, number>>((acc, award) => {
      acc[award.award_name] = (acc[award.award_name] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((leftAward, rightAward) => rightAward[1] - leftAward[1]) // Sort by count (descending)
    .slice(0, 8); // Show top 8 award types

  // Navigation anchors for sticky sidebar
  const anchorSections = [
    { id: 'per-game', label: 'Per Game' },
    { id: 'per-36', label: 'Per 36 Min' },
    { id: 'per-100', label: 'Per 100 Poss' },
    { id: 'totals', label: 'Totals' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'shooting', label: 'Shooting' },
    { id: 'adjusted-shooting', label: 'Adjusted Shooting' },
    { id: 'pbp', label: 'Play-by-Play' },
    { id: 'game-log', label: 'Game Log' },
    { id: 'awards', label: 'Awards' },
    { id: 'salaries', label: 'Salaries' },
    { id: 'highs', label: 'Game Highs' },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb navigation */}
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/players">Players</Link> / {player.full_name}
      </div>

      {/* Player bio header section */}
      <section className="mb-5 border border-line bg-paper-soft p-4">
        <div className="grid gap-4 md:grid-cols-[140px_1fr_260px]">
          {/* Player headshot from Basketball-Reference CDN */}
          <div>
            <Image
              src={`https://www.basketball-reference.com/req/202106291/images/headshots/${player.bref_id}.jpg`}
              alt={`Photo of ${player.full_name}`}
              width={130}
              height={170}
              className="h-42.5 w-32.5 border border-image-line object-cover"
            />
          </div>

          {/* Basic player info grid */}
          <div>
            <h1 className="mb-2 text-3xl font-bold">{player.full_name}</h1>
            <div className="grid gap-1 text-sm text-muted-strong sm:grid-cols-2">
              <div>Position: {player.position ?? '-'}</div>
              <div>Birth: {player.birth_date ?? '-'}</div>
              <div>
                Birthplace:{' '}
                {((): string => {
                  const parts = [player.birth_city, player.birth_country].filter(
                    (part): part is string => part !== null && part.length > 0
                  );
                  return parts.length > 0 ? parts.join(', ') : '-';
                })()}
              </div>
              <div>College: {player.college ?? '-'}</div>
              <div>
                Height: {player.height_cm !== null ? `${Math.round(player.height_cm)} cm` : '-'}
              </div>
              <div>
                Weight: {player.weight_kg !== null ? `${Math.round(player.weight_kg)} kg` : '-'}
              </div>
              <div>
                Draft:{' '}
                {player.draft_year != null
                  ? `${player.draft_year} R${player.draft_round ?? '?'} P${player.draft_number ?? '?'}`
                  : '-'}
              </div>
              <div>Status: {player.is_active === 1 ? 'Active' : 'Inactive'}</div>
              <div>Hall of Fame: {player.hof === 1 ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Career summary stats card */}
          <div className="border border-line-mid bg-white p-3 text-xs">
            <div className="mb-2 font-bold tracking-wide text-crumb uppercase">Career Summary</div>
            <div className="grid grid-cols-2 gap-y-1">
              <span>G</span>
              <span className="text-right tabular-nums">{summary['g'] ?? '-'}</span>
              <span>PTS/G</span>
              <span className="text-right tabular-nums">{summary['pts_pg'] ?? '-'}</span>
              <span>REB/G</span>
              <span className="text-right tabular-nums">{summary['reb_pg'] ?? '-'}</span>
              <span>AST/G</span>
              <span className="text-right tabular-nums">{summary['ast_pg'] ?? '-'}</span>
              <span>FG%</span>
              <span className="text-right tabular-nums">
                {formatPercentage(summary['fg_pct'] as number | null)}
              </span>
              <span>3P%</span>
              <span className="text-right tabular-nums">
                {formatPercentage(summary['fg3_pct'] as number | null)}
              </span>
              <span>FT%</span>
              <span className="text-right tabular-nums">
                {formatPercentage(summary['ft_pct'] as number | null)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Awards badges section (only shown if player has awards) */}
      {awardCounts.length > 0 ? (
        <section className="mb-5 border border-line-mid bg-white p-3">
          <h2 className="mb-2 text-lg font-bold">Leaderboards, Awards, & Honors</h2>
          <div className="flex flex-wrap gap-2">
            {awardCounts.map(([name, count]) => (
              <span
                key={name}
                className="rounded border border-line bg-button-bg px-2 py-1 text-xs"
              >
                {count}x {name}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Main content with sticky sidebar navigation */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sticky navigation sidebar */}
        <aside className="h-max border border-line-mid bg-white p-3 lg:sticky lg:top-3">
          <div className="mb-2 text-xs font-bold tracking-wide text-crumb uppercase">
            On this page
          </div>
          <nav className="space-y-1 text-sm">
            {anchorSections.map(section => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded px-2 py-1 hover:bg-nav-hover"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Statistics sections */}
        <div className="space-y-8">
          {/* Per Game Stats */}
          <section id="per-game" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Per Game</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season' },
                { key: 'team_abbrev', label: 'Tm' },
                { key: 'g', label: 'G', align: 'right' },
                { key: 'gs', label: 'GS', align: 'right' },
                { key: 'mp_pg', label: 'MP', align: 'right' },
                { key: 'pts_pg', label: 'PTS', align: 'right' },
                { key: 'reb_pg', label: 'TRB', align: 'right' },
                { key: 'ast_pg', label: 'AST', align: 'right' },
                { key: 'stl_pg', label: 'STL', align: 'right' },
                { key: 'blk_pg', label: 'BLK', align: 'right' },
                { key: 'tov_pg', label: 'TOV', align: 'right' },
                { key: 'pf_pg', label: 'PF', align: 'right' },
                { key: 'fg_pct', label: 'FG%', align: 'right' },
                { key: 'fg3_pct', label: '3P%', align: 'right' },
                { key: 'ft_pct', label: 'FT%', align: 'right' },
              ]}
              rows={perGameStats}
              initialSort="season_id"
            />
          </section>

          {/* Per 36 Minutes Stats */}
          <section id="per-36" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Per 36 Minutes</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season' },
                { key: 'team_abbrev', label: 'Tm' },
                { key: 'g', label: 'G', align: 'right' },
                { key: 'pts_36', label: 'PTS', align: 'right' },
                { key: 'reb_36', label: 'TRB', align: 'right' },
                { key: 'ast_36', label: 'AST', align: 'right' },
                { key: 'stl_36', label: 'STL', align: 'right' },
                { key: 'blk_36', label: 'BLK', align: 'right' },
                { key: 'tov_36', label: 'TOV', align: 'right' },
                { key: 'pf_36', label: 'PF', align: 'right' },
              ]}
              rows={per36Stats}
              initialSort="season_id"
            />
          </section>

          {/* Season Totals */}
          <section id="totals" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Totals</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season' },
                { key: 'team_abbrev', label: 'Tm' },
                { key: 'g', label: 'G', align: 'right' },
                { key: 'gs', label: 'GS', align: 'right' },
                { key: 'mp', label: 'MP', align: 'right' },
                { key: 'pts', label: 'PTS', align: 'right' },
                { key: 'reb', label: 'TRB', align: 'right' },
                { key: 'ast', label: 'AST', align: 'right' },
                { key: 'stl', label: 'STL', align: 'right' },
                { key: 'blk', label: 'BLK', align: 'right' },
                { key: 'tov', label: 'TOV', align: 'right' },
                { key: 'pf', label: 'PF', align: 'right' },
                { key: 'fg', label: 'FG', align: 'right' },
                { key: 'fga', label: 'FGA', align: 'right' },
                { key: 'x3p', label: '3P', align: 'right' },
                { key: 'x3pa', label: '3PA', align: 'right' },
                { key: 'ft', label: 'FT', align: 'right' },
                { key: 'fta', label: 'FTA', align: 'right' },
              ]}
              rows={seasonStats}
              initialSort="season_id"
            />
          </section>

          {/* Per 100 Possessions Stats */}
          <section id="per-100" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Per 100 Possessions</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season' },
                { key: 'team_abbrev', label: 'Tm' },
                { key: 'g', label: 'G', align: 'right' },
                { key: 'pts_100', label: 'PTS', align: 'right' },
                { key: 'reb_100', label: 'TRB', align: 'right' },
                { key: 'ast_100', label: 'AST', align: 'right' },
                { key: 'stl_100', label: 'STL', align: 'right' },
                { key: 'blk_100', label: 'BLK', align: 'right' },
                { key: 'tov_100', label: 'TOV', align: 'right' },
                { key: 'fg_100', label: 'FG', align: 'right' },
                { key: 'fga_100', label: 'FGA', align: 'right' },
                { key: 'x3p_100', label: '3P', align: 'right' },
                { key: 'x3pa_100', label: '3PA', align: 'right' },
                { key: 'ft_100', label: 'FT', align: 'right' },
                { key: 'fta_100', label: 'FTA', align: 'right' },
              ]}
              rows={per100Stats}
              initialSort="season_id"
            />
          </section>

          {/* Advanced Stats */}
          <section id="advanced" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Advanced</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season' },
                { key: 'team_abbrev', label: 'Tm' },
                { key: 'g', label: 'G', align: 'right' },
                { key: 'per', label: 'PER', align: 'right' },
                { key: 'ts_pct', label: 'TS%', align: 'right' },
                { key: 'usg_pct', label: 'USG%', align: 'right' },
                { key: 'orb_pct', label: 'ORB%', align: 'right' },
                { key: 'drb_pct', label: 'DRB%', align: 'right' },
                { key: 'trb_pct', label: 'TRB%', align: 'right' },
                { key: 'ast_pct', label: 'AST%', align: 'right' },
                { key: 'stl_pct', label: 'STL%', align: 'right' },
                { key: 'blk_pct', label: 'BLK%', align: 'right' },
                { key: 'tov_pct', label: 'TOV%', align: 'right' },
                { key: 'x3p_ar', label: '3PAr', align: 'right' },
                { key: 'f_tr', label: 'FTr', align: 'right' },
                { key: 'ws', label: 'WS', align: 'right' },
                { key: 'ws_48', label: 'WS/48', align: 'right' },
                { key: 'ows', label: 'OWS', align: 'right' },
                { key: 'dws', label: 'DWS', align: 'right' },
                { key: 'obpm', label: 'OBPM', align: 'right' },
                { key: 'dbpm', label: 'DBPM', align: 'right' },
                { key: 'bpm', label: 'BPM', align: 'right' },
                { key: 'vorp', label: 'VORP', align: 'right' },
              ]}
              rows={advancedStats}
              initialSort="season_id"
            />
          </section>

          {/* Shooting Stats (Distance Breakdown) */}
          <section id="shooting" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Shooting</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season' },
                { key: 'team_abbrev', label: 'Tm' },
                { key: 'avg_dist_fga', label: 'AvgDist', align: 'right' },
                { key: 'pct_fga_0_3', label: '%0-3', align: 'right' },
                { key: 'pct_fga_3_10', label: '%3-10', align: 'right' },
                { key: 'pct_fga_10_16', label: '%10-16', align: 'right' },
                { key: 'pct_fga_16_3p', label: '%16-3P', align: 'right' },
                { key: 'pct_fga_3p', label: '%3P', align: 'right' },
                { key: 'fg_pct_0_3', label: 'FG%0-3', align: 'right' },
                { key: 'fg_pct_3_10', label: 'FG%3-10', align: 'right' },
                { key: 'fg_pct_10_16', label: 'FG%10-16', align: 'right' },
                { key: 'fg_pct_16_3p', label: 'FG%16-3P', align: 'right' },
                { key: 'pct_ast_2p', label: 'Ast 2P%', align: 'right' },
                { key: 'pct_ast_3p', label: 'Ast 3P%', align: 'right' },
                { key: 'pct_dunks_fga', label: 'DunkA%', align: 'right' },
                { key: 'pct_corner3_3pa', label: 'Corner3A%', align: 'right' },
                { key: 'corner3_pct', label: 'Corner3%', align: 'right' },
                { key: 'fg_pct_3p', label: '3P%', align: 'right' },
                { key: 'num_dunks', label: 'Dunks', align: 'right' },
              ]}
              rows={shootingStats}
              initialSort="season_id"
            />
          </section>

          {/* Adjusted Shooting (League-Relative) */}
          <section id="adjusted-shooting" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Adjusted Shooting</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season' },
                { key: 'team_abbrev', label: 'Tm' },
                { key: 'g', label: 'G', align: 'right' },
                { key: 'fg_pct', label: 'FG%', align: 'right' },
                { key: 'fg3_pct', label: '3P%', align: 'right' },
                { key: 'ft_pct', label: 'FT%', align: 'right' },
                { key: 'efg_pct', label: 'eFG%', align: 'right' },
                { key: 'ts_pct', label: 'TS%', align: 'right' },
                { key: 'efg_plus', label: 'eFG+', align: 'right' },
                { key: 'ts_plus', label: 'TS+', align: 'right' },
                { key: 'x3p_ar', label: '3PAr', align: 'right' },
                { key: 'f_tr', label: 'FTr', align: 'right' },
              ]}
              rows={adjustedShootingStats}
              initialSort="season_id"
            />
          </section>

          {/* Play-by-Play Derived Stats */}
          <section id="pbp" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Play-by-Play</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season' },
                { key: 'team_abbrev', label: 'Tm' },
                { key: 'pg_pct', label: 'PG%', align: 'right' },
                { key: 'sg_pct', label: 'SG%', align: 'right' },
                { key: 'sf_pct', label: 'SF%', align: 'right' },
                { key: 'pf_pct', label: 'PF%', align: 'right' },
                { key: 'c_pct', label: 'C%', align: 'right' },
                {
                  key: 'on_court_pm_per100',
                  label: 'OnCourt/100',
                  align: 'right',
                },
                { key: 'net_pm_per100', label: 'Net/100', align: 'right' },
                { key: 'bad_pass_tov', label: 'BadPassTO', align: 'right' },
                { key: 'lost_ball_tov', label: 'LostBallTO', align: 'right' },
                {
                  key: 'shoot_foul_drawn',
                  label: 'ShtFoulDrawn',
                  align: 'right',
                },
                {
                  key: 'off_foul_drawn',
                  label: 'OffFoulDrawn',
                  align: 'right',
                },
                { key: 'and1', label: 'And1', align: 'right' },
              ]}
              rows={pbpStats}
              initialSort="season_id"
            />
          </section>

          {/* Full Game Log */}
          <section id="game-log" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Game Log</h2>
            <StatsTable
              columns={[
                { key: 'game_date', label: 'Date' },
                { key: 'team_abbrev', label: 'Tm' },
                { key: 'opp_abbrev', label: 'Opp' },
                { key: 'is_home', label: 'Site' },
                { key: 'result', label: 'W/L' },
                { key: 'team_score', label: 'Tm PTS', align: 'right' },
                { key: 'opp_score', label: 'Opp PTS', align: 'right' },
                { key: 'minutes_played', label: 'MP', align: 'right' },
                { key: 'fgm', label: 'FG', align: 'right' },
                { key: 'fga', label: 'FGA', align: 'right' },
                { key: 'fg3m', label: '3P', align: 'right' },
                { key: 'fg3a', label: '3PA', align: 'right' },
                { key: 'ftm', label: 'FT', align: 'right' },
                { key: 'fta', label: 'FTA', align: 'right' },
                { key: 'pts', label: 'PTS', align: 'right' },
                { key: 'reb', label: 'REB', align: 'right' },
                { key: 'ast', label: 'AST', align: 'right' },
                { key: 'stl', label: 'STL', align: 'right' },
                { key: 'blk', label: 'BLK', align: 'right' },
                { key: 'tov', label: 'TOV', align: 'right' },
                { key: 'gmsc', label: 'GmSc', align: 'right' },
                { key: 'plus_minus', label: '+/-', align: 'right' },
              ]}
              rows={fullGameLog.map(gameLogRow => ({
                ...gameLogRow,
                is_home: Number(gameLogRow['is_home']) === 1 ? 'Home' : 'Away',
              }))}
              initialSort="game_date"
            />
          </section>

          {/* Awards History */}
          <section id="awards" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Awards History</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season' },
                { key: 'award_name', label: 'Award' },
                { key: 'award_type', label: 'Type' },
              ]}
              rows={awards}
              initialSort="season_id"
            />
          </section>

          {/* Salary History */}
          <section id="salaries" className="scroll-mt-4">
            <h2 className="mb-2 text-xl font-bold">Salaries</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season' },
                { key: 'team_abbrev', label: 'Team' },
                { key: 'salary_fmt', label: 'Salary', align: 'right' },
              ]}
              rows={salaries.map(salaryRow => ({
                ...salaryRow,
                salary_fmt: formatUsd(salaryRow['salary'] as number | null),
              }))}
              initialSort="season_id"
            />
          </section>

          {/* Career Game Highs */}
          <section id="highs" className="scroll-mt-4 border border-line-mid bg-white p-3">
            <h2 className="mb-2 text-xl font-bold">Game Highs</h2>
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                MP: <span className="font-bold tabular-nums">{highs['mp'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                FG: <span className="font-bold tabular-nums">{highs['fg'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                FGA: <span className="font-bold tabular-nums">{highs['fga'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                3P: <span className="font-bold tabular-nums">{highs['fg3'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                3PA: <span className="font-bold tabular-nums">{highs['fg3a'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                FT: <span className="font-bold tabular-nums">{highs['ft'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                FTA: <span className="font-bold tabular-nums">{highs['fta'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                PTS: <span className="font-bold tabular-nums">{highs['pts'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                REB: <span className="font-bold tabular-nums">{highs['reb'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                AST: <span className="font-bold tabular-nums">{highs['ast'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                STL: <span className="font-bold tabular-nums">{highs['stl'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                BLK: <span className="font-bold tabular-nums">{highs['blk'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                TOV: <span className="font-bold tabular-nums">{highs['tov'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                PF: <span className="font-bold tabular-nums">{highs['pf'] ?? '-'}</span>
              </div>
              <div className="rounded border border-line-subtle bg-row-alt p-2">
                +/-: <span className="font-bold tabular-nums">{highs['plus_minus'] ?? '-'}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
