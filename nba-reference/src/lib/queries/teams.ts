/**
 * @fileoverview Team data queries - retrieves team information, rosters, and statistics.
 *
 * This module provides query functions for team data:
 * - Basic team information (name, city, conference, division)
 * - Current roster with player stats
 * - Season-by-season team statistics
 * - Recent game results
 * - Four Factors comparison (team vs opponent)
 * - Per-game averages and player leaders
 * - Season navigation (prev/next season)
 *
 * All queries use the cached database layer (30s TTL) for performance.
 *
 * @module @/lib/queries/teams
 */

import { getDb, getLatestSeasonId } from '@/lib/db';

/**
 * Clamps a limit value to a safe positive integer range.
 *
 * @param limit - The raw limit value to clamp
 * @param fallback - Default value if limit is invalid (NaN, not finite, etc.)
 * @param max - Maximum allowed value (hard ceiling)
 * @returns A safe integer between 1 and max
 */
function clampPositiveLimit(limit: number, fallback: number, max: number): number {
  if (!Number.isFinite(limit)) return fallback;
  const truncatedLimit = Math.trunc(limit);
  if (truncatedLimit < 1) return 1;
  if (truncatedLimit > max) return max;
  return truncatedLimit;
}

function getLatestRosterSeasonId(teamId: string): string {
  const latestRosterSeason = getDb()
    .prepare(
      `SELECT season_id
       FROM fact_roster
       WHERE team_id = ?
       ORDER BY season_id DESC
       LIMIT 1`
    )
    .get(teamId) as { season_id: string } | undefined;

  return latestRosterSeason?.season_id ?? getLatestSeasonId();
}

function getLatestGameSeasonId(teamId: string): string | undefined {
  const latestGameSeason = getDb()
    .prepare(
      `SELECT fg.season_id
       FROM fact_game fg
       WHERE (fg.home_team_id = ? OR fg.away_team_id = ?)
         AND fg.home_score IS NOT NULL
         AND fg.away_score IS NOT NULL
       ORDER BY fg.game_date DESC
       LIMIT 1`
    )
    .get(teamId, teamId) as { season_id: string } | undefined;

  return latestGameSeason?.season_id;
}

/**
 * Retrieves team information by abbreviation.
 *
 * Matches against either the standard abbreviation (e.g., "LAL") or
 * the Basketball-Reference abbreviation.
 *
 * @param abbrev - Team abbreviation (e.g., "LAL", "NYK")
 * @returns Team record or undefined if not found
 */
export function getTeamByAbbrev(abbrev: string):
  | {
      team_id: string;
      abbreviation: string;
      full_name: string;
      city: string;
      nickname: string;
      conference: string | null;
      division: string | null;
      arena_name: string | null;
      founded_year: number | null;
    }
  | undefined {
  return getDb()
    .prepare(
      `SELECT team_id, abbreviation, full_name, city, nickname,
              conference, division, arena_name, founded_year
       FROM dim_team
       WHERE (abbreviation = ? OR bref_abbrev = ?)
         AND EXISTS (
           SELECT 1
           FROM fact_team_season ts
           WHERE ts.bref_abbrev = dim_team.bref_abbrev
             AND (ts.lg = 'NBA' OR ts.lg IS NULL)
         )`
    )
    .get(abbrev, abbrev) as
    | {
        team_id: string;
        abbreviation: string;
        full_name: string;
        city: string;
        nickname: string;
        conference: string | null;
        division: string | null;
        arena_name: string | null;
        founded_year: number | null;
      }
    | undefined;
}

/**
 * Retrieve the current roster for a team.
 *
 * Determines the most recent season with roster data for the team; if none exists, falls back to the latest season ID from the database.
 *
 * @param teamId - Internal team ID
 * @returns An array of player records for the roster. Each record contains `bref_id`, `full_name`, `position`, `height_cm`, `weight_kg`, and `birth_date` (values may be `null` where unknown)
 */
export function getTeamRoster(teamId: string): Array<Record<string, string | number | null>> {
  const seasonId = getLatestRosterSeasonId(teamId);

  return getDb()
    .prepare(
      `SELECT p.bref_id, p.full_name, p.position, p.height_cm, p.weight_kg, p.birth_date
       FROM fact_roster r
       JOIN dim_player p ON p.player_id = r.player_id
       WHERE r.team_id = ? AND r.season_id = ?
       ORDER BY p.last_name ASC`
    )
    .all(teamId, seasonId) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieves the team's current roster with per-game season statistics.
 *
 * @param teamId - Internal team identifier
 * @returns An array of roster records. Each record includes player identifiers and profile fields (`bref_id`, `full_name`, `position`, `height_cm`, `weight_kg`, `birth_date`), season games played (`g`), and per-game averages (`pts_pg`, `reb_pg`, `ast_pg`) as numbers or `null` when not available
 */
export function getTeamRosterWithStats(
  teamId: string
): Array<Record<string, string | number | null>> {
  const seasonId = getLatestRosterSeasonId(teamId);
  return getTeamRosterWithStatsForSeason(teamId, seasonId);
}

export function getTeamRosterWithStatsForSeason(
  teamId: string,
  seasonId: string
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT p.bref_id,
              p.full_name,
              p.position,
              p.height_cm,
              p.weight_kg,
              p.birth_date,
              fs.g,
              CASE WHEN fs.g > 0 THEN ROUND(1.0 * fs.pts / fs.g, 1) END AS pts_pg,
              CASE WHEN fs.g > 0 THEN ROUND(1.0 * fs.reb / fs.g, 1) END AS reb_pg,
              CASE WHEN fs.g > 0 THEN ROUND(1.0 * fs.ast / fs.g, 1) END AS ast_pg
       FROM fact_roster r
       JOIN dim_player p ON p.player_id = r.player_id
        LEFT JOIN fact_player_season_stats fs
          ON fs.bref_player_id = p.bref_id
         AND fs.season_id = r.season_id
         AND fs.team_abbrev IN (SELECT abbreviation FROM dim_team WHERE team_id = r.team_id)
         AND (fs.lg = 'NBA' OR fs.lg IS NULL)
        WHERE r.team_id = ? AND r.season_id = ?
         ORDER BY COALESCE(pts_pg, -999) DESC, p.last_name ASC`
    )
    .all(teamId, seasonId) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieve team and opponent Four Factors for the team's most recent season.
 *
 * Four Factors include effective field goal percentage, turnover rate, offensive rebound percentage, and free-throw rate; this returns those metrics and the opponent counterparts for the latest season row.
 *
 * @param teamAbbrev - Team abbreviation (e.g., "LAL")
 * @returns A record containing `season_id` and Four Factors fields (team and opponent) or `undefined` if no season data is found
 */
export function getTeamFourFactorsComparison(
  teamAbbrev: string
): Record<string, string | number | null> | undefined {
  const current = getTeamCurrentSeasonSummary(teamAbbrev);
  const seasonId = typeof current?.['season_id'] === 'string' ? current['season_id'] : null;
  if (seasonId == null) return undefined;

  return getTeamFourFactorsComparisonForSeason(teamAbbrev, seasonId);
}

export function getTeamFourFactorsComparisonForSeason(
  teamAbbrev: string,
  seasonId: string
): Record<string, string | number | null> | undefined {
  return getDb()
    .prepare(
      `SELECT season_id,
              e_fg_pct,
              tov_pct,
              orb_pct,
              ft_fga,
              opp_e_fg_pct,
               opp_tov_pct,
               drb_pct,
               opp_ft_fga
        FROM fact_team_season
        WHERE bref_abbrev = ?
          AND (lg = 'NBA' OR lg IS NULL)
          AND season_id = ?
        LIMIT 1`
    )
    .get(teamAbbrev, seasonId) as Record<string, string | number | null> | undefined;
}

/**
 * Retrieve season-by-season statistics for a team.
 *
 * Provides up to the most recent 20 seasons of team data, including wins, losses,
 * margin of victory, offensive/defensive/net ratings, pace, true shooting percentage,
 * effective field goal percentage, and turnover percentage.
 *
 * @param teamAbbrev - Team abbreviation (e.g., "LAL")
 * @returns An array of season records ordered newest first, each containing fields such as `season_id`, `w`, `l`, `mov`, `o_rtg`, `d_rtg`, `n_rtg`, `pace`, `ts_pct`, `e_fg_pct`, and `tov_pct`
 */
export function getTeamSeasonStats(
  teamAbbrev: string
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, w, l, mov, o_rtg, d_rtg, n_rtg, pace,
              ts_pct, e_fg_pct, tov_pct
       FROM fact_team_season
       WHERE bref_abbrev = ?
         AND (lg = 'NBA' OR lg IS NULL)
       ORDER BY season_id DESC
       LIMIT 20`
    )
    .all(teamAbbrev) as Array<Record<string, string | number | null>>;
}

/**
 * Determine the previous and next season IDs for a team relative to a given season.
 *
 * @param teamAbbrev - Team abbreviation (e.g., "LAL")
 * @param seasonId - Season ID to find neighbors for (e.g., "2024-25")
 * @returns An object with `prev` set to the previous season ID or `null`, and `next` set to the next season ID or `null`
 */
export function getTeamSeasonNeighbors(
  teamAbbrev: string,
  seasonId: string
): { prev: string | null; next: string | null } {
  const seasons = getDb()
    .prepare(
      `SELECT DISTINCT season_id
       FROM fact_team_season
       WHERE bref_abbrev = ?
         AND (lg = 'NBA' OR lg IS NULL)
       ORDER BY season_id DESC`
    )
    .all(teamAbbrev) as Array<{ season_id: string }>;

  const seasonIndex = seasons.findIndex(season => season.season_id === seasonId);
  return {
    prev:
      seasonIndex >= 0 && seasonIndex + 1 < seasons.length
        ? (seasons[seasonIndex + 1]?.season_id ?? null)
        : null,
    next: seasonIndex > 0 ? (seasons[seasonIndex - 1]?.season_id ?? null) : null,
  };
}

/**
 * Retrieve the most recent season summary for a team.
 *
 * The record includes season metadata and team metrics such as wins, losses,
 * margin of victory, rating metrics, pace, efficiency percentages, arena, and attendance.
 *
 * @param teamAbbrev - Team abbreviation (e.g., "LAL")
 * @returns The most recent season summary containing `season_id`, `w`, `l`, `mov`, `srs`, `o_rtg`, `d_rtg`, `n_rtg`, `pace`, `ts_pct`, `e_fg_pct`, `tov_pct`, `arena`, `attend`, and `attend_g`, or `undefined` if no record exists
 */
export function getTeamCurrentSeasonSummary(
  teamAbbrev: string
): Record<string, string | number | null> | undefined {
  return getDb()
    .prepare(
      `SELECT season_id, w, l, mov, srs, o_rtg, d_rtg, n_rtg, pace,
              ts_pct, e_fg_pct, tov_pct, arena, attend, attend_g
       FROM fact_team_season
       WHERE bref_abbrev = ?
         AND (lg = 'NBA' OR lg IS NULL)
       ORDER BY season_id DESC
       LIMIT 1`
    )
    .get(teamAbbrev) as Record<string, string | number | null> | undefined;
}

export function getTeamSeasonSummary(
  teamAbbrev: string,
  seasonId: string
): Record<string, string | number | null> | undefined {
  return getDb()
    .prepare(
      `SELECT season_id, w, l, mov, srs, o_rtg, d_rtg, n_rtg, pace,
              ts_pct, e_fg_pct, tov_pct, orb_pct, ft_fga,
              opp_e_fg_pct, opp_tov_pct, drb_pct, opp_ft_fga,
              arena, attend, attend_g
       FROM fact_team_season
       WHERE bref_abbrev = ?
          AND (lg = 'NBA' OR lg IS NULL)
          AND season_id = ?
       LIMIT 1`
    )
    .get(teamAbbrev, seasonId) as Record<string, string | number | null> | undefined;
}

/**
 * Retrieves recent completed games for a team.
 *
 * Calculates win/loss result and scores from the team's perspective
 * (team_score = this team's score, opp_score = opponent's score).
 * Handles both home and away games.
 *
 * @param teamId - Internal team ID
 * @param limit - Maximum number of games to return (default: 20)
 * @returns Array of game records with result, ordered by date (newest first)
 */
export function getTeamRecentGames(
  teamId: string,
  limit = 20
): Array<Record<string, string | number | null>> {
  const safeLimit = clampPositiveLimit(limit, 20, 100);
  const seasonId = getLatestGameSeasonId(teamId);
  if (seasonId === undefined) return [];

  return getTeamRecentGamesForSeason(teamId, seasonId, safeLimit);
}

export function getTeamRecentGamesForSeason(
  teamId: string,
  seasonId: string,
  limit = 20
): Array<Record<string, string | number | null>> {
  const safeLimit = clampPositiveLimit(limit, 20, 100);

  return getDb()
    .prepare(
      `SELECT g.game_id, g.game_date,
              -- 1 if this team was home, 0 if away (for display purposes)
              CASE WHEN g.home_team_id = ? THEN 1 ELSE 0 END AS is_home,
              -- Team abbreviation (changes based on home/away)
              CASE WHEN g.home_team_id = ? THEN ht.abbreviation ELSE at.abbreviation END AS team_abbrev,
              -- Opponent abbreviation
              CASE WHEN g.home_team_id = ? THEN at.abbreviation ELSE ht.abbreviation END AS opp_abbrev,
              -- This team's score
              CASE WHEN g.home_team_id = ? THEN g.home_score ELSE g.away_score END AS team_score,
              -- Opponent's score
              CASE WHEN g.home_team_id = ? THEN g.away_score ELSE g.home_score END AS opp_score,
              -- Calculate W/L from this team's perspective
              CASE
                WHEN (CASE WHEN g.home_team_id = ? THEN g.home_score ELSE g.away_score END) >
                     (CASE WHEN g.home_team_id = ? THEN g.away_score ELSE g.home_score END)
                THEN 'W'
                WHEN (CASE WHEN g.home_team_id = ? THEN g.home_score ELSE g.away_score END) <
                     (CASE WHEN g.home_team_id = ? THEN g.away_score ELSE g.home_score END)
                THEN 'L'
                ELSE 'T'
              END AS result
        FROM fact_game g
        JOIN dim_team ht ON ht.team_id = g.home_team_id
        JOIN dim_team at ON at.team_id = g.away_team_id
        WHERE (g.home_team_id = ? OR g.away_team_id = ?)
          AND g.season_id = ?
          AND g.home_score IS NOT NULL
          AND g.away_score IS NOT NULL
        ORDER BY g.game_date DESC
       LIMIT ?`
    )
    .all(
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      seasonId,
      safeLimit
    ) as Array<Record<string, string | number | null>>;
}

/**
 * Get per-game averages for the team's most recent season with game data.
 *
 * @param teamId - Internal team identifier
 * @returns An object containing per-game averages: `pts`, `reb`, `ast`, `stl`, `blk`, `tov`, `fg3m`, `fg3a`, `fg_pct`, and `ft_pct` (each a number or `null`), or `undefined` if the team has no games for any season
 */
export function getTeamPerGameAverages(teamId: string): Record<string, number | null> | undefined {
  const seasonId = getLatestGameSeasonId(teamId);
  if (seasonId === undefined) return undefined;

  return getTeamPerGameAveragesForSeason(teamId, seasonId);
}

export function getTeamPerGameAveragesForSeason(
  teamId: string,
  seasonId: string
): Record<string, number | null> | undefined {
  return getDb()
    .prepare(
      `SELECT
          ROUND(AVG(tgl.pts), 1) AS pts,
          ROUND(AVG(tgl.reb), 1) AS reb,
          ROUND(AVG(tgl.ast), 1) AS ast,
          ROUND(AVG(tgl.stl), 1) AS stl,
          ROUND(AVG(tgl.blk), 1) AS blk,
          ROUND(AVG(tgl.tov), 1) AS tov,
          ROUND(AVG(tgl.fg3m), 1) AS fg3m,
          ROUND(AVG(tgl.fg3a), 1) AS fg3a,
          ROUND(AVG(CASE WHEN tgl.fga > 0 THEN 1.0 * tgl.fgm / tgl.fga END), 3) AS fg_pct,
          ROUND(AVG(CASE WHEN tgl.fta > 0 THEN 1.0 * tgl.ftm / tgl.fta END), 3) AS ft_pct
       FROM team_game_log tgl
        JOIN fact_game fg ON fg.game_id = tgl.game_id
        WHERE tgl.team_id = ? AND fg.season_id = ?`
    )
    .get(teamId, seasonId) as Record<string, number | null>;
}

/**
 * Retrieves the team's top scoring leaders for the most recent season with game data.
 *
 * Players must have played at least 10 games; results are ordered by points per game and limited to `limit`.
 *
 * @param teamId - Internal team identifier used to filter player game logs
 * @param limit - Maximum number of leaders to return (default: 8)
 * @returns An array of leader records with fields: `bref_id`, `full_name`, `g`, `pts`, `reb`, `ast`, `pts_pg`, `reb_pg`, `ast_pg`
 */
export function getTeamPlayerLeaders(
  teamId: string,
  limit = 8
): Array<Record<string, string | number | null>> {
  const safeLimit = clampPositiveLimit(limit, 8, 100);
  const seasonId = getLatestGameSeasonId(teamId);
  if (seasonId === undefined) return [];

  return getTeamPlayerLeadersForSeason(teamId, seasonId, safeLimit);
}

export function getTeamPlayerLeadersForSeason(
  teamId: string,
  seasonId: string,
  limit = 8
): Array<Record<string, string | number | null>> {
  const safeLimit = clampPositiveLimit(limit, 8, 100);

  return getDb()
    .prepare(
      `SELECT dp.bref_id, dp.full_name,
              COUNT(*) AS g,
              SUM(pgl.pts) AS pts,
              SUM(pgl.reb) AS reb,
              SUM(pgl.ast) AS ast,
              ROUND(1.0 * SUM(pgl.pts) / COUNT(*), 1) AS pts_pg,
              ROUND(1.0 * SUM(pgl.reb) / COUNT(*), 1) AS reb_pg,
              ROUND(1.0 * SUM(pgl.ast) / COUNT(*), 1) AS ast_pg
       FROM player_game_log pgl
       JOIN fact_game fg ON fg.game_id = pgl.game_id
       JOIN dim_player dp ON dp.player_id = pgl.player_id
       WHERE pgl.team_id = ?
         AND fg.season_id = ?
       GROUP BY dp.player_id
       HAVING COUNT(*) >= 10  -- Minimum games threshold
       ORDER BY pts_pg DESC
       LIMIT ?`
    )
    .all(teamId, seasonId, safeLimit) as Array<Record<string, string | number | null>>;
}
