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

import { getDb } from '@/lib/db';
import {
  clampPositiveLimit,
  getLatestGameSeasonId,
  getLatestRosterSeasonId,
  getTeamPerGameAveragesForSeason,
  getTeamPlayerLeadersForSeason,
  getTeamRecentGamesForSeason,
} from './team-stat-helpers';
export {
  getTeamPerGameAveragesForSeason,
  getTeamPlayerLeadersForSeason,
  getTeamRecentGamesForSeason,
} from './team-stat-helpers';

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
