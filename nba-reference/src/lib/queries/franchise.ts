import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';

export interface FranchiseHistoryEntry {
  team_city: string;
  team_name: string;
  team_abbrev: string;
  season_founded: number;
  season_active_till: number;
  league: string;
}

export interface FranchiseSeason {
  season_id: string;
  start_year: number;
  end_year: number;
  wins: number;
  losses: number;
  win_pct: number;
  playoffs: string | null;
}

export function getFranchiseHistory(teamAbbrev: string): FranchiseHistoryEntry[] {
  return getCachedQueryMany<FranchiseHistoryEntry[]>(
    `SELECT 
      th.team_city,
      th.team_name,
      th.team_abbrev,
      th.season_founded,
      th.season_active_till,
      th.league
    FROM dim_team_history th
    JOIN dim_team t ON t.team_id = th.team_id
    WHERE t.bref_abbrev = ? OR t.abbreviation = ?
    ORDER BY th.season_founded ASC`,
    [teamAbbrev, teamAbbrev],
    60_000
  );
}

export function getFranchiseSeasons(teamAbbrev: string): FranchiseSeason[] {
  return getCachedQueryMany<FranchiseSeason[]>(
    `SELECT 
      ts.season_id,
      s.start_year,
      s.end_year,
      ts.w,
      ts.l,
      ROUND(ts.w * 100.0 / NULLIF(ts.w + ts.l, 0), 1) as win_pct,
      CASE 
        WHEN ts.playoffs IS NOT NULL AND ts.playoffs != '' THEN ts.playoffs
        ELSE NULL
      END as playoffs
    FROM fact_team_season ts
    JOIN dim_season s ON s.season_id = ts.season_id
    WHERE ts.bref_abbrev = ?
    ORDER BY s.start_year DESC`,
    [teamAbbrev],
    60_000
  );
}

export interface Championship {
  season_id: string;
  year: number;
  title: string;
}

export function getFranchiseChampionships(teamAbbrev: string): Championship[] {
  // Try to infer championships from playoff game data
  // Champion is the team that wins the last game of the playoffs in a season
  const rows = getCachedQueryMany<Array<{ season_id: string; game_date: string; year: number }>>(
    `WITH last_playoff_games AS (
      SELECT 
        g.season_id,
        MAX(g.game_date) as last_game_date
      FROM fact_game g
      JOIN dim_team t ON t.bref_abbrev = ? OR t.abbreviation = ?
      WHERE g.season_type = 'Playoffs'
        AND g.status = 'Final'
        AND (g.home_team_id = t.team_id OR g.away_team_id = t.team_id)
      GROUP BY g.season_id
    ),
    championship_games AS (
      SELECT 
        g.season_id,
        g.game_date,
        g.home_team_id,
        g.away_team_id,
        g.home_score,
        g.away_score,
        CASE 
          WHEN g.home_score > g.away_score THEN g.home_team_id
          ELSE g.away_team_id
        END as winner_id
      FROM fact_game g
      JOIN last_playoff_games lpg ON lpg.season_id = g.season_id 
        AND lpg.last_game_date = g.game_date
      WHERE g.season_type = 'Playoffs'
    )
    SELECT 
      cg.season_id,
      CAST(SUBSTR(cg.season_id, 1, 4) AS INTEGER) + 1 as year
    FROM championship_games cg
    JOIN dim_team t ON t.bref_abbrev = ? OR t.abbreviation = ?
    WHERE cg.winner_id = t.team_id
    ORDER BY cg.season_id DESC`,
    [teamAbbrev, teamAbbrev, teamAbbrev, teamAbbrev],
    60_000
  );

  return rows.map(row => ({
    season_id: row.season_id,
    year: row.year,
    title: 'NBA Champion',
  }));
}

export function getCurrentFranchiseInfo(teamAbbrev: string):
  | {
      team_name: string;
      city: string;
      founded: number;
      conference: string | null;
      division: string | null;
    }
  | undefined {
  return getCachedQueryOne(
    `SELECT 
      t.full_name as team_name,
      t.city,
      MIN(th.season_founded) as founded,
      t.conference,
      t.division
    FROM dim_team t
    LEFT JOIN dim_team_history th ON th.team_id = t.team_id
    WHERE t.bref_abbrev = ? OR t.abbreviation = ?
    GROUP BY t.team_id, t.full_name, t.city, t.conference, t.division`,
    [teamAbbrev, teamAbbrev],
    60_000
  );
}
