/**
 * @fileoverview Player season statistics queries - per-game, per-36, per-100, and raw totals.
 *
 * @module @/lib/queries/players/season-stats
 */

import { getDb } from '@/lib/db';

/**
 * Retrieves raw season totals for a player.
 *
 * Returns counting stats (games, minutes, points, rebounds, etc.)
 * without any per-game calculations.
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of season total records, ordered by season (newest first)
 *
 * @example
 * const stats = getPlayerSeasonStats('jamesle01', 5);
 * console.log(stats[0].pts); // Total points in most recent season
 */
export function getPlayerSeasonStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g, gs, mp, fg, fga, x3p, x3pa,
              ft, fta, reb, ast, stl, blk, tov, pf, pts
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves per-36-minutes statistics for a player.
 *
 * Per-36 is a normalized metric that shows what a player's stats would be
 * if they played 36 minutes per game (approximate starter minutes).
 * Calculation: stat * 36 / minutes_played
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of per-36 stats, ordered by season (newest first)
 *
 * @example
 * const stats = getPlayerPer36Stats('jamesle01');
 * console.log(stats[0].pts_36); // Points per 36 minutes
 */
export function getPlayerPer36Stats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, g, mp,
              -- Per-36 calculation: normalize stats to 36-minute basis
              CASE WHEN mp > 0 THEN ROUND(1.0 * pts * 36 / mp, 1) END AS pts_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * reb * 36 / mp, 1) END AS reb_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * ast * 36 / mp, 1) END AS ast_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * stl * 36 / mp, 1) END AS stl_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * blk * 36 / mp, 1) END AS blk_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * tov * 36 / mp, 1) END AS tov_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * pf * 36 / mp, 1) END AS pf_36
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves per-100-possessions statistics for a player.
 *
 * Per-100 normalizes stats to a per-possession basis, enabling fair
 * comparison across different pace/era teams.
 * Calculation: stat * 4800 / (minutes * team_pace)
 * - 4800 = 48 minutes * 100 possessions (standard game length)
 * - Team pace from fact_team_season, defaults to 100 if unavailable
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of per-100 stats, ordered by season (newest first)
 *
 * @example
 * const stats = getPlayerPer100Stats('jamesle01');
 * console.log(stats[0].pts_100); // Points per 100 possessions
 */
export function getPlayerPer100Stats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT pss.season_id, pss.team_abbrev, pss.g,
              -- Per-100 calculation: normalize to 100 possessions per 48 min game
              -- 4800 = 48 min * 100 possessions
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.pts * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS pts_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.reb * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS reb_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.ast * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS ast_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.stl * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS stl_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.blk * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS blk_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.tov * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS tov_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.fg * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS fg_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.fga * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS fga_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.x3p * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS x3p_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.x3pa * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS x3pa_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.ft * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS ft_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.fta * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS fta_100
       FROM fact_player_season_stats pss
       LEFT JOIN fact_team_season fts
         ON fts.season_id = pss.season_id
        AND fts.bref_abbrev = pss.team_abbrev
       WHERE pss.bref_player_id = ?
       ORDER BY pss.season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves per-game statistics for a player.
 *
 * Per-game stats are the most commonly viewed format, showing averages
 * per game played. Includes shooting percentages.
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of per-game stats, ordered by season (newest first)
 *
 * @example
 * const stats = getPlayerPerGameStats('jamesle01');
 * console.log(stats[0].pts_pg); // Points per game
 */
export function getPlayerPerGameStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g, gs,
              CASE WHEN g > 0 THEN ROUND(1.0 * mp / g, 1) END AS mp_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * pts / g, 1) END AS pts_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * reb / g, 1) END AS reb_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * ast / g, 1) END AS ast_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * stl / g, 1) END AS stl_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * blk / g, 1) END AS blk_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * tov / g, 1) END AS tov_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * pf / g, 1) END AS pf_pg,
              CASE WHEN fga > 0 THEN ROUND(1.0 * fg / fga, 3) END AS fg_pct,
              CASE WHEN x3pa > 0 THEN ROUND(1.0 * x3p / x3pa, 3) END AS fg3_pct,
              CASE WHEN fta > 0 THEN ROUND(1.0 * ft / fta, 3) END AS ft_pct
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}
