import { getDb } from '@/lib/db';

export interface TeamSalaryRow {
  season_id: string;
  team_abbrev: string;
  bref_id: string;
  full_name: string;
  salary: number;
}

export interface SalaryCapRow {
  season_id: string;
  cap_amount: number;
}

export function getTeamSalarySeasons(teamAbbrev: string): string[] {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT fs.season_id
       FROM fact_salary fs
       JOIN dim_team dt ON dt.team_id = fs.team_id
       JOIN fact_team_season ts
         ON ts.season_id = fs.season_id
        AND ts.bref_abbrev = dt.bref_abbrev
       WHERE (dt.abbreviation = ? OR dt.bref_abbrev = ?)
         AND ts.lg = 'NBA'
       ORDER BY fs.season_id DESC`
    )
    .all(teamAbbrev, teamAbbrev) as Array<{ season_id: string }>;

  return rows.map(row => row.season_id);
}

export function getTeamSalariesBySeason(teamAbbrev: string, seasonId: string): TeamSalaryRow[] {
  return getDb()
    .prepare(
      `SELECT fs.season_id,
              dt.bref_abbrev AS team_abbrev,
              dp.bref_id,
              dp.full_name,
              fs.salary
       FROM fact_salary fs
       JOIN dim_team dt ON dt.team_id = fs.team_id
       JOIN dim_player dp ON dp.player_id = fs.player_id
       JOIN fact_team_season ts
         ON ts.season_id = fs.season_id
        AND ts.bref_abbrev = dt.bref_abbrev
       WHERE (dt.abbreviation = ? OR dt.bref_abbrev = ?)
         AND fs.season_id = ?
         AND ts.lg = 'NBA'
       ORDER BY fs.salary DESC, dp.full_name ASC`
    )
    .all(teamAbbrev, teamAbbrev, seasonId) as TeamSalaryRow[];
}

export function getLeagueSalaryCapHistory(limit = 50): SalaryCapRow[] {
  return getDb()
    .prepare(
      `SELECT season_id, cap_amount
       FROM dim_salary_cap
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(limit) as SalaryCapRow[];
}

export function getSalaryLeadersBySeason(
  seasonId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT dp.bref_id,
              dp.full_name,
              dt.bref_abbrev AS team_abbrev,
              fs.salary
       FROM fact_salary fs
       JOIN dim_player dp ON dp.player_id = fs.player_id
       JOIN dim_team dt ON dt.team_id = fs.team_id
       JOIN fact_team_season ts
         ON ts.season_id = fs.season_id
        AND ts.bref_abbrev = dt.bref_abbrev
       WHERE fs.season_id = ?
         AND ts.lg = 'NBA'
       ORDER BY fs.salary DESC
       LIMIT ?`
    )
    .all(seasonId, limit) as Array<Record<string, string | number | null>>;
}
