import { getDb } from '@/lib/db';

export type TeamScheduleGame = {
  game_id: string;
  game_date: string;
  status: string | null;
  location: 'Home' | 'Away';
  opponent_abbrev: string;
  opponent_name: string;
  team_score: number | null;
  opp_score: number | null;
  result: 'W' | 'L' | 'Scheduled';
};

export function getTeamSchedule(teamAbbrev: string, seasonId: string): TeamScheduleGame[] {
  return getDb()
    .prepare(
      `SELECT
         g.game_id,
         g.game_date,
         g.status,
         CASE
           WHEN g.home_team_id = t.team_id THEN 'Home'
           ELSE 'Away'
         END AS location,
         opp.abbreviation AS opponent_abbrev,
         opp.full_name AS opponent_name,
         CASE
           WHEN g.home_team_id = t.team_id THEN g.home_score
           ELSE g.away_score
         END AS team_score,
         CASE
           WHEN g.home_team_id = t.team_id THEN g.away_score
           ELSE g.home_score
         END AS opp_score,
         CASE
           WHEN g.status NOT LIKE 'Final%' OR g.home_score IS NULL OR g.away_score IS NULL THEN 'Scheduled'
           WHEN (g.home_team_id = t.team_id AND g.home_score > g.away_score) OR
                (g.away_team_id = t.team_id AND g.away_score > g.home_score) THEN 'W'
           ELSE 'L'
         END AS result
       FROM fact_game g
       JOIN dim_team t ON (t.abbreviation = ? OR t.bref_abbrev = ?)
       JOIN dim_team opp ON opp.team_id = CASE
         WHEN g.home_team_id = t.team_id THEN g.away_team_id
         ELSE g.home_team_id
       END
       WHERE g.season_id = ?
         AND (g.home_team_id = t.team_id OR g.away_team_id = t.team_id)
       ORDER BY g.game_date ASC, g.game_id ASC`
    )
    .all(teamAbbrev, teamAbbrev, seasonId) as TeamScheduleGame[];
}

export function getTeamRecordAsOf(
  gameId: string,
  teamId: string
): {
  w: number;
  l: number;
} {
  const row = getDb()
    .prepare(
      `WITH target AS (
         SELECT game_date, season_id
         FROM fact_game
         WHERE game_id = ?
         LIMIT 1
       )
       SELECT
         COALESCE(SUM(CASE
           WHEN (g.home_team_id = ? AND g.home_score > g.away_score) OR
                (g.away_team_id = ? AND g.away_score > g.home_score) THEN 1
           ELSE 0
         END), 0) AS w,
         COALESCE(SUM(CASE
           WHEN (g.home_team_id = ? AND g.home_score < g.away_score) OR
                (g.away_team_id = ? AND g.away_score < g.home_score) THEN 1
           ELSE 0
         END), 0) AS l
       FROM fact_game g
       JOIN target t ON 1 = 1
       WHERE t.season_id IS NOT NULL
         AND g.season_id = t.season_id
         AND (g.home_team_id = ? OR g.away_team_id = ?)
         AND g.status LIKE 'Final%'
         AND g.home_score IS NOT NULL
         AND g.away_score IS NOT NULL
         AND (
           g.game_date < t.game_date OR
           (g.game_date = t.game_date AND g.game_id <= ?)
         )`
    )
    .get(gameId, teamId, teamId, teamId, teamId, teamId, teamId, gameId) as
    | { w: number | null; l: number | null }
    | undefined;

  return {
    w: Number(row?.w ?? 0),
    l: Number(row?.l ?? 0),
  };
}
