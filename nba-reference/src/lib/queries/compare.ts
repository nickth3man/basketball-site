/**
 * @fileoverview Player comparison queries.
 *
 * Provides queries to fetch player information and career statistics
 * for side-by-side comparison views.
 *
 * @module @/lib/queries/compare
 */

import { getCachedQueryOne } from '@/lib/db';

export interface PlayerComparisonInfo {
  bref_id: string;
  full_name: string;
  position: string | null;
  height: string | null;
  weight: number | null;
}

export interface PlayerCareerStats {
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  per: number | null;
  ws: number | null;
}

export interface PlayerComparisonData {
  info: PlayerComparisonInfo;
  stats: PlayerCareerStats;
}

/**
 * Fetches basic player information for comparison display.
 *
 * @param brefId - Basketball Reference player ID
 * @returns Player info object or undefined if not found
 */
export function getPlayerInfo(brefId: string): PlayerComparisonInfo | undefined {
  return getCachedQueryOne<PlayerComparisonInfo>(
    'SELECT bref_id, full_name, position, height, weight FROM dim_player WHERE bref_id = ?',
    [brefId]
  );
}

/**
 * Fetches career average statistics for a player.
 *
 * Only includes seasons with at least 20 games played to filter out
 * partial/injury-shortened seasons that would skew averages.
 *
 * @param brefId - Basketball Reference player ID
 * @returns Career stats object or undefined if no qualifying seasons found
 */
export function getPlayerCareerAverages(brefId: string): PlayerCareerStats | undefined {
  return getCachedQueryOne<PlayerCareerStats>(
    `SELECT 
      ROUND(AVG(pts_pg), 1) as ppg,
      ROUND(AVG(trb_pg), 1) as rpg,
      ROUND(AVG(ast_pg), 1) as apg,
      ROUND(AVG(stl_pg), 1) as spg,
      ROUND(AVG(blk_pg), 1) as bpg,
      ROUND(AVG(fg_pct), 3) as fg_pct,
      ROUND(AVG(fg3_pct), 3) as fg3_pct,
      ROUND(AVG(ft_pct), 3) as ft_pct,
      ROUND(AVG(per), 1) as per,
      ROUND(AVG(ws), 1) as ws
    FROM fact_player_season_stats
    WHERE bref_player_id = ? AND g >= 20 AND lg = 'NBA'`,
    [brefId]
  );
}

/**
 * Fetches complete comparison data for a single player.
 *
 * @param brefId - Basketball Reference player ID
 * @returns Combined player info and stats, or undefined if not found
 */
export function getPlayerComparisonData(brefId: string): PlayerComparisonData | undefined {
  const info = getPlayerInfo(brefId);
  if (info === undefined) {
    return undefined;
  }

  const stats = getPlayerCareerAverages(brefId);
  if (stats === undefined) {
    return undefined;
  }

  return { info, stats };
}
