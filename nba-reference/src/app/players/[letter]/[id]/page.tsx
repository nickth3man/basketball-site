/**
 * @fileoverview Player detail page - comprehensive player statistics dashboard.
 *
 * This page displays 14+ data sections using extracted sub-components:
 * - Player bio (photo, position, birth info, draft, career summary)
 * - Awards and honors badges
 * - Per-game, per-36, per-100 possession stats
 * - Season totals and advanced metrics
 * - Shooting breakdowns and adjusted shooting
 * - Play-by-play derived stats
 * - Full game log
 * - Awards history
 * - Salary history
 * - Career game highs
 *
 * Data is fetched server-side in parallel for optimal performance.
 * Uses sticky navigation sidebar for section jumping.
 *
 * @module @/app/players/[letter]/[id]/page
 */

import type React from 'react';
import { Suspense } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CareerTrajectoryChart } from '@/components/charts';
import { RelatedLinksPanel } from '@/components/related-links-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsTable } from '@/components/stats-table';
import { formatUsd } from '@/lib/formatters';
import { getPlayerPageData } from '@/lib/query';
import { routes } from '@/lib/routes';
import type { CareerSeasonData } from '@/lib/types/charts';
import { validateBrefId } from '@/lib/validation';
import { AwardsBadges, GameHighs, PlayerBioHeader } from './components';

interface PlayerPageParams {
  letter: string;
  id: string;
}

interface PlayerPageProps {
  params: Promise<PlayerPageParams>;
}

/**
 * Navigation sections for sticky sidebar.
 */
const ANCHOR_SECTIONS = [
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
] as const;

/**
 * Validates URL letter matches player ID first letter (BBR-style canonical URL).
 */
function validateLetterMatch(letter: string, id: string): boolean {
  return /^[a-z]$/i.test(letter) && id.slice(0, 1).toLowerCase() === letter.toLowerCase();
}

/**
 * Render a server-side player detail page.
 */
export default async function PlayerPage({ params }: PlayerPageProps): Promise<React.JSX.Element> {
  const { letter, id } = await params;

  if (!validateLetterMatch(letter, id)) {
    notFound();
  }

  validateBrefId(id);

  const playerPageData = getPlayerPageData(id);
  if (playerPageData?.player == null) notFound();
  const {
    adjustedShootingStats,
    advancedStats,
    awardCounts,
    awards,
    fullGameLog,
    highs,
    pbpStats,
    per100Stats,
    per36Stats,
    perGameStats,
    player,
    salaries,
    seasonStats,
    shootingStats,
    summary,
  } = playerPageData;
  const playerRelatedLinks = [
    {
      href: `/players/${letter}/${id}/splits` as Route,
      label: 'Player Splits',
      description: 'Opponent and situational split tables for this player.',
    },
    {
      href: routes.search(player.full_name),
      label: 'Search Similar Results',
      description: 'Jump back into search using this player name as the starting point.',
    },
    {
      href: '/leaders' as Route,
      label: 'League Leaders',
      description: 'Compare this player against current and all-time league leaders.',
    },
    {
      href: `/players/${letter}` as Route,
      label: `More ${letter.toUpperCase()} Players`,
      description: 'Browse the alphabetical player directory around this profile.',
    },
  ];

  const careerData: CareerSeasonData[] = perGameStats
    .filter(
      row =>
        row['season_id'] != null &&
        row['pts_pg'] != null &&
        row['reb_pg'] != null &&
        row['ast_pg'] != null
    )
    .slice()
    .sort((a, b) => {
      const seasonA = String(a['season_id']);
      const seasonB = String(b['season_id']);
      return seasonA.localeCompare(seasonB);
    })
    .map(row => ({
      season: String(row['season_id']),
      ppg: Number(row['pts_pg']),
      rpg: Number(row['reb_pg']),
      apg: Number(row['ast_pg']),
    }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb navigation */}
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/players">Players</Link> / {player.full_name}
      </div>

      <PlayerBioHeader player={player} summary={summary} />
      <AwardsBadges awardCounts={awardCounts} />

      {/* Main content with sticky sidebar navigation */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sticky navigation sidebar */}
        <aside className="h-max border border-line-mid bg-white p-3 lg:sticky lg:top-3">
          <div className="mb-2 text-xs font-bold tracking-wide text-crumb uppercase">
            On this page
          </div>
          <nav aria-label="Player page sections" className="space-y-1 text-sm">
            {ANCHOR_SECTIONS.map(section => (
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
          {/* Career Trajectory Chart */}
          <section className="mb-8 rounded-lg border border-line bg-paper p-4">
            <h2 className="mb-4 text-xl font-bold text-heading">Career Trajectory</h2>
            <CareerTrajectoryChart data={careerData} />
          </section>

          {/* Per Game Stats */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="per-game" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Per Game</h2>
              <StatsTable
                columns={[
                  { key: 'season_id', label: 'Season', link: { type: 'league' } },
                  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
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
          </Suspense>

          {/* Per 36 Minutes Stats */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="per-36" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Per 36 Minutes</h2>
              <StatsTable
                columns={[
                  { key: 'season_id', label: 'Season', link: { type: 'league' } },
                  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
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
          </Suspense>

          {/* Season Totals */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="totals" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Totals</h2>
              <StatsTable
                columns={[
                  { key: 'season_id', label: 'Season', link: { type: 'league' } },
                  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
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
          </Suspense>

          {/* Per 100 Possessions Stats */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="per-100" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Per 100 Possessions</h2>
              <StatsTable
                columns={[
                  { key: 'season_id', label: 'Season', link: { type: 'league' } },
                  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
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
          </Suspense>

          {/* Advanced Stats */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="advanced" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Advanced</h2>
              <StatsTable
                columns={[
                  { key: 'season_id', label: 'Season', link: { type: 'league' } },
                  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
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
          </Suspense>

          {/* Shooting Stats (Distance Breakdown) */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="shooting" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Shooting</h2>
              <StatsTable
                columns={[
                  { key: 'season_id', label: 'Season', link: { type: 'league' } },
                  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
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
          </Suspense>

          {/* Adjusted Shooting (League-Relative) */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="adjusted-shooting" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Adjusted Shooting</h2>
              <StatsTable
                columns={[
                  { key: 'season_id', label: 'Season', link: { type: 'league' } },
                  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
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
          </Suspense>

          {/* Play-by-Play Derived Stats */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="pbp" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Play-by-Play</h2>
              <StatsTable
                columns={[
                  { key: 'season_id', label: 'Season', link: { type: 'league' } },
                  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
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
          </Suspense>

          {/* Full Game Log */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="game-log" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Game Log</h2>
              <StatsTable
                columns={[
                  {
                    key: 'game_date',
                    label: 'Date',
                    link: { type: 'boxscore', valueKey: 'game_id' },
                  },
                  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
                  { key: 'opp_abbrev', label: 'Opp', link: { type: 'team' } },
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
          </Suspense>

          {/* Awards History */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="awards" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Awards History</h2>
              <StatsTable
                columns={[
                  { key: 'season_id', label: 'Season', link: { type: 'league' } },
                  { key: 'award_name', label: 'Award' },
                  { key: 'award_type', label: 'Type' },
                ]}
                rows={awards}
                initialSort="season_id"
              />
            </section>
          </Suspense>

          {/* Salary History */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="salaries" className="scroll-mt-4">
              <h2 className="mb-2 text-xl font-bold">Salaries</h2>
              <StatsTable
                columns={[
                  { key: 'season_id', label: 'Season', link: { type: 'league' } },
                  { key: 'team_abbrev', label: 'Team', link: { type: 'team' } },
                  { key: 'salary_fmt', label: 'Salary', align: 'right' },
                ]}
                rows={salaries.map(salaryRow => ({
                  ...salaryRow,
                  salary_fmt: formatUsd(salaryRow['salary'] as number | null),
                }))}
                initialSort="season_id"
              />
            </section>
          </Suspense>

          <GameHighs highs={highs} />
          <RelatedLinksPanel links={playerRelatedLinks} title="Related Links" />
        </div>
      </div>
    </main>
  );
}
