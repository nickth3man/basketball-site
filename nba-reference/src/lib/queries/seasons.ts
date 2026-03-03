/**
 * @fileoverview Season data queries - retrieves league-wide season information.
 *
 * This module provides query functions for season-level data:
 * - Season list with year ranges
 * - Season standings (all teams)
 * - Statistical leaders (scoring, rebounding, assists)
 * - League summary averages
 * - Recent games for a season
 *
 * All queries use the cached database layer (30s TTL) for performance.
 *
 * @module @/lib/queries/seasons
 */

import { getDb } from '@/lib/db';

/**
 * Retrieves a list of NBA seasons.
 *
 * @param limit - Maximum number of seasons to return (default: 30)
 * @returns Array of season records with ID and year range, ordered by start year (newest first)
 */
export function getSeasonList(
  limit = 30
): Array<{ season_id: string; start_year: number; end_year: number }> {
  return getDb()
    .prepare(
      `SELECT season_id, start_year, end_year
       FROM dim_season
       ORDER BY start_year DESC
       LIMIT ?`
    )
    .all(limit) as Array<{ season_id: string; start_year: number; end_year: number }>;
}

/**
 * Retrieve final team standings for the specified season.
 *
 * Results are ordered by wins (descending) then losses (ascending).
 *
 * @param seasonId - Season identifier (for example, "2024-25")
 * @returns An array of records for each team containing: `bref_abbrev` (team abbreviation), `w` (wins), `l` (losses), `srs` (Simple Rating System), `o_rtg` (offensive rating), `d_rtg` (defensive rating), `n_rtg` (net rating), and `pace`. Numeric fields may be `null`.
 */
export function getSeasonStandings(
  seasonId: string
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT bref_abbrev, w, l, srs, o_rtg, d_rtg, n_rtg, pace
       FROM fact_team_season
       WHERE season_id = ?
       ORDER BY w DESC, l ASC`
    )
    .all(seasonId) as Array<Record<string, string | number | null>>;
}

/**
 * Get the top scoring leaders for a season ordered by points per game.
 *
 * Includes only players with at least 10 games and returns both total and per-game scoring.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @param limit - Maximum number of leaders to return (default: 25)
 * @returns Array of records with fields: `bref_id` (player Basketball-Reference id), `full_name`, `team` (team abbreviation), `g` (games played), `pts` (total points), `pts_pg` (points per game, rounded to one decimal)
 */
export function getSeasonScoringLeaders(
  seasonId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT p.bref_id, p.full_name, GROUP_CONCAT(DISTINCT fpss.team_abbrev) as team,
              SUM(fpss.g) as g,
              SUM(fpss.pts) as pts,
              ROUND(1.0 * SUM(fpss.pts) / SUM(fpss.g), 1) as pts_pg
       FROM fact_player_season_stats fpss
       JOIN dim_player p ON p.bref_id = fpss.bref_player_id
       WHERE fpss.season_id = ?
         AND fpss.team_abbrev NOT LIKE '%TM'
       GROUP BY p.bref_id, p.full_name
       HAVING SUM(fpss.g) >= 10
       ORDER BY pts_pg DESC
       LIMIT ?`
    )
    .all(seasonId, limit) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieves the top rebounding leaders for a season.
 *
 * Returns players who played at least 10 games in the season, ordered by rebounds per game.
 *
 * @param seasonId - Season ID (e.g., "2024-25")
 * @param limit - Maximum number of leaders to return
 * @returns Array of records with `bref_id`, `full_name`, `team`, `g` (games), `reb` (total rebounds), and `reb_pg` (rebounds per game)
 */
export function getSeasonReboundLeaders(
  seasonId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT p.bref_id, p.full_name, GROUP_CONCAT(DISTINCT fpss.team_abbrev) as team,
              SUM(fpss.g) as g,
              SUM(fpss.reb) as reb,
              ROUND(1.0 * SUM(fpss.reb) / SUM(fpss.g), 1) as reb_pg
       FROM fact_player_season_stats fpss
       JOIN dim_player p ON p.bref_id = fpss.bref_player_id
       WHERE fpss.season_id = ?
         AND fpss.team_abbrev NOT LIKE '%TM'
       GROUP BY p.bref_id, p.full_name
       HAVING SUM(fpss.g) >= 10
       ORDER BY reb_pg DESC
       LIMIT ?`
    )
    .all(seasonId, limit) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieve the season's top assist leaders ranked by assists per game.
 *
 * Players must have played at least 10 games; results are limited by `limit`.
 *
 * @param seasonId - Season identifier (for example, "2024-25")
 * @param limit - Maximum number of leaders to return (default: 25)
 * @returns An array of records with the following fields:
 *  - `bref_id`: Basketball-Reference player identifier
 *  - `full_name`: Player's full name
 *  - `team`: Team abbreviation
 *  - `g`: Games played (integer)
 *  - `ast`: Total assists (integer)
 *  - `ast_pg`: Assists per game rounded to one decimal place (number)
 */
export function getSeasonAssistLeaders(
  seasonId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT p.bref_id, p.full_name, GROUP_CONCAT(DISTINCT fpss.team_abbrev) as team,
              SUM(fpss.g) as g,
              SUM(fpss.ast) as ast,
              ROUND(1.0 * SUM(fpss.ast) / SUM(fpss.g), 1) as ast_pg
       FROM fact_player_season_stats fpss
       JOIN dim_player p ON p.bref_id = fpss.bref_player_id
       WHERE fpss.season_id = ?
         AND fpss.team_abbrev NOT LIKE '%TM'
       GROUP BY p.bref_id, p.full_name
       HAVING SUM(fpss.g) >= 10
       ORDER BY ast_pg DESC
       LIMIT ?`
    )
    .all(seasonId, limit) as Array<Record<string, string | number | null>>;
}

/**
 * Compute league-wide per-game team averages for a given season.
 *
 * Averages are calculated across all regular-season team game logs for the specified season.
 *
 * @param seasonId - Season identifier (for example, "2024-25")
 * @returns A record with:
 *  - `ppg`: average team points per game (rounded to 1 decimal),
 *  - `rpg`: average team rebounds per game (rounded to 1 decimal),
 *  - `apg`: average team assists per game (rounded to 1 decimal),
 *  - `efg_pct`: league average effective field-goal percentage (decimal, rounded to 3 decimals),
 *  - `ts_pct`: league average true shooting percentage (decimal, rounded to 3 decimals)
 */
export function getSeasonLeagueSummary(seasonId: string): Record<string, number | null> {
  return getDb()
    .prepare(
      `SELECT ROUND(AVG(pts), 1) AS ppg,
              ROUND(AVG(reb), 1) AS rpg,
              ROUND(AVG(ast), 1) AS apg,
              ROUND(AVG(CASE WHEN fga > 0 THEN 1.0 * (fgm + 0.5 * fg3m) / fga END), 3) AS efg_pct,
              ROUND(AVG(CASE WHEN (fga + 0.44 * fta) > 0 THEN 1.0 * pts / (2 * (fga + 0.44 * fta)) END), 3) AS ts_pct
       FROM team_game_log tgl
       JOIN fact_game fg ON fg.game_id = tgl.game_id
       WHERE fg.season_id = ?
         AND fg.season_type = 'Regular Season'`
    )
    .get(seasonId) as Record<string, number | null>;
}

/**
 * Retrieves recent completed games for a season.
 *
 * Only returns games with final scores (home_score and away_score not null).
 *
 * @param seasonId - Season ID (e.g., "2024-25")
 * @param limit - Maximum number of games to return (default: 50)
 * @returns Array of game records, ordered by date (newest first)
 */
export function getSeasonRecentGames(
  seasonId: string,
  limit = 50
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT g.game_id, g.game_date,
              ht.abbreviation as home_abbrev,
              at.abbreviation as away_abbrev,
              g.home_score,
              g.away_score
       FROM fact_game g
       JOIN dim_team ht ON ht.team_id = g.home_team_id
       JOIN dim_team at ON at.team_id = g.away_team_id
       WHERE g.season_id = ?
         AND g.home_score IS NOT NULL
         AND g.away_score IS NOT NULL
       ORDER BY g.game_date DESC
       LIMIT ?`
    )
    .all(seasonId, limit) as Array<Record<string, string | number | null>>;
}
