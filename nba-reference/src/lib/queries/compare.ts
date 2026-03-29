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
  height_cm: number | null;
  weight_kg: number | null;
}

export interface PlayerCareerStats {
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
  spg: number | null;
  bpg: number | null;
  fg_pct: number | null;
  fg3_pct: number | null;
  ft_pct: number | null;
  per: number | null;
  ws: number | null;
}

export interface PlayerComparisonData {
  info: PlayerComparisonInfo;
  stats: PlayerCareerStats;
}

export interface TeamComparisonInfo {
  abbreviation: string;
  full_name: string;
  conference: string | null;
  division: string | null;
}

export interface TeamSeasonStats {
  wins: number | null;
  losses: number | null;
  o_rtg: number | null;
  d_rtg: number | null;
  n_rtg: number | null;
  pace: number | null;
  ts_pct: number | null;
  e_fg_pct: number | null;
}

/**
 * Fetches basic player information for comparison display.
 *
 * @param brefId - Basketball Reference player ID
 * @returns Player info object or undefined if not found
 */
export function getPlayerInfo(brefId: string): PlayerComparisonInfo | undefined {
  return getCachedQueryOne<PlayerComparisonInfo>(
    'SELECT bref_id, full_name, position, height_cm, weight_kg FROM dim_player WHERE bref_id = ?',
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
      ROUND(AVG(CASE WHEN g > 0 THEN 1.0 * pts / g END), 1) as ppg,
      ROUND(AVG(CASE WHEN g > 0 THEN 1.0 * reb / g END), 1) as rpg,
      ROUND(AVG(CASE WHEN g > 0 THEN 1.0 * ast / g END), 1) as apg,
      ROUND(AVG(CASE WHEN g > 0 THEN 1.0 * stl / g END), 1) as spg,
      ROUND(AVG(CASE WHEN g > 0 THEN 1.0 * blk / g END), 1) as bpg,
      ROUND(AVG(CASE WHEN fga > 0 THEN 1.0 * fg / fga END), 3) as fg_pct,
      ROUND(AVG(CASE WHEN x3pa > 0 THEN 1.0 * x3p / x3pa END), 3) as fg3_pct,
      ROUND(AVG(CASE WHEN fta > 0 THEN 1.0 * ft / fta END), 3) as ft_pct,
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
 * Validates that all required stats fields are non-null before returning.
 *
 * @param brefId - Basketball Reference player ID
 * @returns Combined player info and stats, or undefined if not found or insufficient data
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

  // Validate that core stats are non-null (not just the object exists)
  if (stats.ppg == null || stats.rpg == null || stats.apg == null) {
    return undefined;
  }

  return { info, stats };
}

export function getTeamInfo(abbrev: string): TeamComparisonInfo | undefined {
  return getCachedQueryOne<TeamComparisonInfo>(
    'SELECT abbreviation, full_name, conference, division FROM dim_team WHERE abbreviation = ?',
    [abbrev]
  );
}

export function getTeamCurrentStats(abbrev: string): TeamSeasonStats | undefined {
  return getCachedQueryOne<TeamSeasonStats>(
    `SELECT
      w as wins,
      l as losses,
      ROUND(o_rtg, 1) as o_rtg,
      ROUND(d_rtg, 1) as d_rtg,
      ROUND(n_rtg, 1) as n_rtg,
      ROUND(pace, 1) as pace,
      ROUND(ts_pct, 3) as ts_pct,
      ROUND(e_fg_pct, 3) as e_fg_pct
    FROM fact_team_season
    WHERE bref_abbrev = ? AND lg = 'NBA'
    ORDER BY season_id DESC
    LIMIT 1`,
    [abbrev]
  );
}
