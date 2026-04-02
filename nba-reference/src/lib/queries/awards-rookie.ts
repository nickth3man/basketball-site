import { getCachedQueryMany } from '@/lib/db';
import type { AllTeamHistoryRow, AllTeamSelectionRow } from './awards-shared';

export function getAllRookieTeams(seasonId: string): {
  first: AllTeamSelectionRow[];
  second: AllTeamSelectionRow[];
} {
  const allTeams = getCachedQueryMany<AllTeamSelectionRow[]>(
    `SELECT
      an.team_number,
      an.position,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name
    FROM fact_all_nba an
    JOIN dim_player p ON p.player_id = an.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = p.bref_id
      AND ps.season_id = an.season_id
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.season_id = ?
      AND an.team_type = 'All-Rookie'
    ORDER BY an.team_number, an.position`,
    [seasonId],
    60_000
  );

  return {
    first: allTeams.filter(team => team.team_number === 1),
    second: allTeams.filter(team => team.team_number === 2),
  };
}

export function getAllRookieHistory(): AllTeamHistoryRow[] {
  return getCachedQueryMany<AllTeamHistoryRow[]>(
    `SELECT
      an.season_id,
      s.start_year,
      s.end_year,
      an.team_number,
      CASE
        WHEN an.team_number = 1 THEN 'First Team'
        WHEN an.team_number = 2 THEN 'Second Team'
      END as team_name,
      an.position,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev
    FROM fact_all_nba an
    JOIN dim_season s ON s.season_id = an.season_id
    JOIN dim_player p ON p.player_id = an.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = p.bref_id
      AND ps.season_id = an.season_id
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.team_type = 'All-Rookie'
    ORDER BY s.start_year DESC, an.team_number, an.position`,
    [],
    60_000
  );
}

export function getAllNBAVotingBySeason(
  seasonId: string
): Array<Record<string, string | number | null>> {
  return getCachedQueryMany<Array<Record<string, string | number | null>>>(
    `SELECT anv.season_id,
            anv.team_type,
            anv.team_number,
            anv.position,
            p.bref_id,
            p.full_name,
            t.bref_abbrev AS team_abbrev,
            anv.pts_won,
            anv.pts_max,
            anv.share,
            anv.first_team_votes,
            anv.second_team_votes,
            anv.third_team_votes
      FROM (
        SELECT DISTINCT ps.season_id, ps.bref_player_id
        FROM fact_player_season_stats ps
        WHERE ps.season_id = ?
          AND ps.team_abbrev NOT LIKE '%TM'
          AND (ps.lg = 'NBA' OR ps.lg IS NULL)
      ) ps_dedup
      JOIN fact_all_nba_vote anv ON anv.player_id = ps_dedup.bref_player_id AND anv.season_id = ps_dedup.season_id
      JOIN dim_player p ON p.bref_id = anv.player_id
      LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = anv.player_id
        AND t_ps.season_id = anv.season_id
        AND t_ps.team_abbrev NOT LIKE '%TM'
        AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
      LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
      WHERE anv.season_id = ?
      ORDER BY anv.pts_won DESC, anv.team_number ASC, p.full_name ASC`,
    [seasonId, seasonId],
    60_000
  );
}
