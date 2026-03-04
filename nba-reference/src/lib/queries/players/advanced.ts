/**
 * @fileoverview Player advanced statistics queries - PER, VORP, WS, shooting breakdowns.
 *
 * @module @/lib/queries/players/advanced
 */

import { getDb } from '@/lib/db';

/**
 * Retrieves advanced statistics for a player.
 *
 * Advanced metrics provide deeper performance analysis:
 * - PER: Player Efficiency Rating (league average = 15)
 * - TS%: True Shooting% (accounts for 3P and FT)
 * - USG%: Usage Rate (% of team plays used)
 * - WS: Win Shares (total contribution)
 * - BPM/VORP: Box Plus-Minus / Value Over Replacement Player
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of advanced stats, ordered by season (newest first)
 *
 * @example
 * const stats = getPlayerAdvancedSeasonStats('jamesle01');
 * console.log(stats[0].per);    // Player Efficiency Rating
 * console.log(stats[0].ws);     // Win Shares
 * console.log(stats[0].vorp);   // Value Over Replacement Player
 */
export function getPlayerAdvancedSeasonStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g, mp,
              per, ts_pct, x3p_ar, f_tr,
              orb_pct, drb_pct, trb_pct, ast_pct, stl_pct, blk_pct, tov_pct,
              usg_pct, ows, dws, ws, ws_48, obpm, dbpm, bpm, vorp
       FROM fact_player_advanced_season
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves shooting breakdown statistics for a player.
 *
 * Shows shot distribution by distance and accuracy:
 * - % of FGA from each distance zone (0-3ft, 3-10ft, 10-16ft, 16-3P, 3P)
 * - FG% from each zone
 * - Corner 3 stats (higher value shots)
 * - Dunk frequency
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of shooting stats, ordered by season (newest first)
 *
 * @example
 * const stats = getPlayerShootingSeasonStats('curryst01');
 * console.log(stats[0].fg_pct_3p); // 3-point percentage
 */
export function getPlayerShootingSeasonStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, g, mp, avg_dist_fga,
              pct_fga_0_3, pct_fga_3_10, pct_fga_10_16, pct_fga_16_3p, pct_fga_3p,
              fg_pct_0_3, fg_pct_3_10, fg_pct_10_16, fg_pct_16_3p, fg_pct_3p,
              pct_ast_2p, pct_ast_3p,
              pct_dunks_fga, num_dunks,
              pct_corner3_3pa, corner3_pct
       FROM fact_player_shooting_season
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves adjusted shooting statistics with league-relative metrics.
 *
 * Adjusted shooting compares player efficiency to league average:
 * - eFG+ / TS+: 100 = league average, >100 = above average
 * - Calculated against league averages from team_game_log
 *
 * This provides era-adjusted context for shooting efficiency.
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of adjusted shooting stats, ordered by season (newest first)
 *
 * @example
 * const stats = getPlayerAdjustedShootingStats('jamesle01');
 * console.log(stats[0].ts_plus); // True Shooting relative to league (100 = avg)
 */
export function getPlayerAdjustedShootingStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT pss.season_id,
              pss.team_abbrev,
              pss.g,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * pss.fg / pss.fga, 3) END AS fg_pct,
              CASE WHEN pss.x3pa > 0 THEN ROUND(1.0 * pss.x3p / pss.x3pa, 3) END AS fg3_pct,
              CASE WHEN pss.fta > 0 THEN ROUND(1.0 * pss.ft / pss.fta, 3) END AS ft_pct,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * (pss.fg + 0.5 * pss.x3p) / pss.fga, 3) END AS efg_pct,
              CASE WHEN (pss.fga + 0.44 * pss.fta) > 0 THEN ROUND(1.0 * pss.pts / (2 * (pss.fga + 0.44 * pss.fta)), 3) END AS ts_pct,
              -- League-relative metrics: 100 = league average
              CASE WHEN lg.avg_efg IS NOT NULL AND lg.avg_efg > 0 AND pss.fga > 0
                THEN ROUND(100.0 * ((pss.fg + 0.5 * pss.x3p) * 1.0 / pss.fga) / lg.avg_efg, 0)
              END AS efg_plus,
              CASE WHEN lg.avg_ts IS NOT NULL AND lg.avg_ts > 0 AND (pss.fga + 0.44 * pss.fta) > 0
                THEN ROUND(100.0 * (pss.pts * 1.0 / (2 * (pss.fga + 0.44 * pss.fta))) / lg.avg_ts, 0)
              END AS ts_plus,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * pss.x3pa / pss.fga, 3) END AS x3p_ar,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * pss.fta / pss.fga, 3) END AS f_tr
       FROM fact_player_season_stats pss
       LEFT JOIN (
         -- Calculate league averages per season from team game logs
         SELECT season_id,
                CASE WHEN SUM(fga) > 0 THEN 1.0 * SUM(fgm + 0.5 * fg3m) / SUM(fga) END AS avg_efg,
                CASE WHEN SUM(fga + 0.44 * fta) > 0 THEN 1.0 * SUM(pts) / (2 * SUM(fga + 0.44 * fta)) END AS avg_ts
         FROM team_game_log tgl
         JOIN fact_game fg ON fg.game_id = tgl.game_id
         WHERE fg.season_type = 'Regular Season'
         GROUP BY fg.season_id
       ) lg ON lg.season_id = pss.season_id
       WHERE pss.bref_player_id = ?
       ORDER BY pss.season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves play-by-play derived statistics for a player.
 *
 * PBP stats estimate position played (PG/SG/SF/PF/C percentages)
 * based on who they shared the court with.
 * Also includes turnover types and fouls drawn.
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of PBP stats, ordered by season (newest first)
 *
 * @example
 * const stats = getPlayerPbpSeasonStats('jamesle01');
 * console.log(stats[0].pg_pct); // Percentage played at Point Guard
 */
export function getPlayerPbpSeasonStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, g, mp,
              pg_pct, sg_pct, sf_pct, pf_pct, c_pct,
              on_court_pm_per100, net_pm_per100,
              bad_pass_tov, lost_ball_tov,
              shoot_foul_drawn, off_foul_drawn, and1
       FROM fact_player_pbp_season
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}
