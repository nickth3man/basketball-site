import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatsTable } from '@/components/stats-table';
import {
  getTeamByAbbrev,
  getTeamFourFactorsComparisonForSeason,
  getTeamPerGameAveragesForSeason,
  getTeamPlayerLeadersForSeason,
  getTeamRecentGamesForSeason,
  getTeamRosterWithStatsForSeason,
  getTeamSeasonNeighbors,
  getTeamSeasonStats,
  getTeamSeasonSummary,
} from '@/lib/queries';
import { parseSeasonTokenToSeasonId, seasonIdToEndYear } from '@/lib/season-utils';
import { formatSignedNumber } from '@/lib/formatters';
import { validateTeamAbbrev } from '@/lib/validation';

export default async function TeamSeasonPage({
  params,
}: {
  params: Promise<{ abbrev: string; season: string }>;
}): Promise<React.JSX.Element> {
  const { abbrev, season } = await params;
  const normalizedAbbrev = validateTeamAbbrev(abbrev.toUpperCase());
  const seasonId = parseSeasonTokenToSeasonId(season);
  if (seasonId == null) notFound();

  const team = getTeamByAbbrev(normalizedAbbrev);
  if (team == null) notFound();

  const seasonSummary = getTeamSeasonSummary(team.abbreviation, seasonId);
  if (seasonSummary == null) notFound();

  const seasonStats = getTeamSeasonStats(team.abbreviation);
  const neighbors = getTeamSeasonNeighbors(team.abbreviation, seasonId);
  const roster = getTeamRosterWithStatsForSeason(team.team_id, seasonId);
  const fourFactors = getTeamFourFactorsComparisonForSeason(team.abbreviation, seasonId);
  const averages = getTeamPerGameAveragesForSeason(team.team_id, seasonId);
  const leaders = getTeamPlayerLeadersForSeason(team.team_id, seasonId, 12);
  const recentGames = getTeamRecentGamesForSeason(team.team_id, seasonId, 25);

  const previousEndYear =
    neighbors.prev == null ? null : seasonIdToEndYear(neighbors.prev)?.toString() ?? null;
  const nextEndYear =
    neighbors.next == null ? null : seasonIdToEndYear(neighbors.next)?.toString() ?? null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/teams">Teams</Link> /{' '}
        <Link href={`/teams/${team.abbreviation}`}>{team.abbreviation}</Link> / {seasonId}
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">
          {seasonId} {team.full_name}
        </h1>
        <div className="flex items-center gap-2 text-sm">
          {previousEndYear == null ? (
            <span className="rounded border border-line px-2 py-1 text-muted">Previous Season</span>
          ) : (
            <Link
              href={`/teams/${team.abbreviation}/${previousEndYear}` as Route}
              className="rounded border border-line bg-button-bg px-2 py-1"
            >
              Previous Season
            </Link>
          )}
          {nextEndYear == null ? (
            <span className="rounded border border-line px-2 py-1 text-muted">Next Season</span>
          ) : (
            <Link
              href={`/teams/${team.abbreviation}/${nextEndYear}` as Route}
              className="rounded border border-line bg-button-bg px-2 py-1"
            >
              Next Season
            </Link>
          )}
        </div>
      </div>

      <section className="mb-5 border border-line bg-paper-soft p-4">
        <div className="grid gap-2 text-sm text-muted-strong md:grid-cols-3">
          <div>Conference: {team.conference ?? '-'}</div>
          <div>Division: {team.division ?? '-'}</div>
          <div>Arena: {seasonSummary['arena'] ?? team.arena_name ?? '-'}</div>
          <div>
            Record: {seasonSummary['w'] ?? '-'}-{seasonSummary['l'] ?? '-'}
          </div>
          <div>Net Rtg: {formatSignedNumber(seasonSummary['n_rtg'] as number | null)}</div>
          <div>Pace: {seasonSummary['pace'] ?? '-'}</div>
          <div>Off Rtg: {seasonSummary['o_rtg'] ?? '-'}</div>
          <div>Def Rtg: {seasonSummary['d_rtg'] ?? '-'}</div>
          <div>SRS: {formatSignedNumber(seasonSummary['srs'] as number | null)}</div>
        </div>
        {averages == null ? null : (
          <div className="mt-3 grid gap-2 border border-line-soft bg-white p-3 text-xs sm:grid-cols-5 lg:grid-cols-10">
            <div>
              PTS/G: <span className="font-bold tabular-nums">{averages['pts'] ?? '-'}</span>
            </div>
            <div>
              REB/G: <span className="font-bold tabular-nums">{averages['reb'] ?? '-'}</span>
            </div>
            <div>
              AST/G: <span className="font-bold tabular-nums">{averages['ast'] ?? '-'}</span>
            </div>
            <div>
              STL/G: <span className="font-bold tabular-nums">{averages['stl'] ?? '-'}</span>
            </div>
            <div>
              BLK/G: <span className="font-bold tabular-nums">{averages['blk'] ?? '-'}</span>
            </div>
            <div>
              TOV/G: <span className="font-bold tabular-nums">{averages['tov'] ?? '-'}</span>
            </div>
            <div>
              3PM/G: <span className="font-bold tabular-nums">{averages['fg3m'] ?? '-'}</span>
            </div>
            <div>
              3PA/G: <span className="font-bold tabular-nums">{averages['fg3a'] ?? '-'}</span>
            </div>
            <div>
              FG%: <span className="font-bold tabular-nums">{averages['fg_pct'] ?? '-'}</span>
            </div>
            <div>
              FT%: <span className="font-bold tabular-nums">{averages['ft_pct'] ?? '-'}</span>
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Roster</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'position', label: 'Pos' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'pts_pg', label: 'PTS', align: 'right' },
            { key: 'reb_pg', label: 'REB', align: 'right' },
            { key: 'ast_pg', label: 'AST', align: 'right' },
            { key: 'height_cm', label: 'Height (cm)', align: 'right' },
            { key: 'weight_kg', label: 'Weight (kg)', align: 'right' },
          ]}
          rows={roster}
          initialSort="pts_pg"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Four Factors (Team vs Opponent)</h2>
        <StatsTable
          columns={[
            { key: 'side', label: 'Side' },
            { key: 'efg_pct', label: 'eFG%', align: 'right' },
            { key: 'tov_pct', label: 'TOV%', align: 'right' },
            { key: 'orb_pct', label: 'ORB%', align: 'right' },
            { key: 'ft_fga', label: 'FT/FGA', align: 'right' },
          ]}
          rows={
            fourFactors == null
              ? []
              : [
                  {
                    side: 'Team',
                    efg_pct: fourFactors['e_fg_pct'] ?? null,
                    tov_pct: fourFactors['tov_pct'] ?? null,
                    orb_pct: fourFactors['orb_pct'] ?? null,
                    ft_fga: fourFactors['ft_fga'] ?? null,
                  },
                  {
                    side: 'Opponent',
                    efg_pct: fourFactors['opp_e_fg_pct'] ?? null,
                    tov_pct: fourFactors['opp_tov_pct'] ?? null,
                    orb_pct:
                      fourFactors['drb_pct'] == null ? null : 100 - Number(fourFactors['drb_pct']),
                    ft_fga: fourFactors['opp_ft_fga'] ?? null,
                  },
                ]
          }
          initialSort="side"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Player Leaders</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'pts_pg', label: 'PTS', align: 'right' },
            { key: 'reb_pg', label: 'REB', align: 'right' },
            { key: 'ast_pg', label: 'AST', align: 'right' },
            { key: 'pts', label: 'Tot PTS', align: 'right' },
          ]}
          rows={leaders}
          initialSort="pts_pg"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Recent Games</h2>
        <StatsTable
          columns={[
            { key: 'game_date', label: 'Date' },
            { key: 'result', label: 'W/L' },
            { key: 'opp_abbrev', label: 'Opp' },
            { key: 'is_home', label: 'Site' },
            { key: 'team_score', label: 'Team', align: 'right' },
            { key: 'opp_score', label: 'Opp', align: 'right' },
            { key: 'game_id', label: 'Game ID' },
          ]}
          rows={recentGames.map(row => ({
            ...row,
            is_home: Number(row['is_home']) === 1 ? 'Home' : 'Away',
          }))}
          initialSort="game_date"
        />
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Season History</h2>
        <StatsTable
          columns={[
            { key: 'season_id', label: 'Season' },
            { key: 'w', label: 'W', align: 'right' },
            { key: 'l', label: 'L', align: 'right' },
            { key: 'o_rtg', label: 'ORtg', align: 'right' },
            { key: 'd_rtg', label: 'DRtg', align: 'right' },
            { key: 'n_rtg', label: 'NRtg', align: 'right' },
            { key: 'pace', label: 'Pace', align: 'right' },
          ]}
          rows={seasonStats}
          initialSort="season_id"
        />
      </section>
    </main>
  );
}
