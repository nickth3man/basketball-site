/**
 * @fileoverview Stat leader queries — scoring, assists, steals, blocks, rebounds champions.
 *
 * Each function returns the per-season leader for the given stat, derived from
 * fact_player_season_stats totals (minimum 25 games played, NBA league only,
 * single-team rows only to avoid double-counting traded players).
 *
 * All queries use the cached database layer (60 s TTL) for performance.
 *
 * @module @/lib/queries/awards/stat-leaders
 */

import { getCachedQueryMany } from '@/lib/db';

export interface StatLeaderRow {
  season_id: string;
  start_year: number;
  end_year: number;
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
  stat_value: number;
  games: number;
}

/** Allowed stat columns for per-season leader queries. */
const ALLOWED_STAT_COLS = new Set(['pts', 'ast', 'stl', 'blk', 'reb'] as const);
type StatCol = 'pts' | 'ast' | 'stl' | 'blk' | 'reb';

/**
 * Build the per-season stat-leader query for a given raw stat column.
 * Uses a window function to rank players within each season, then picks rank 1.
 *
 * @param statCol - Column name in fact_player_season_stats (must be one of the allowed stat columns)
 */
function buildStatLeaderSQL(statCol: StatCol): string {
  // Guard: only allow known column names to prevent SQL injection.
  if (!ALLOWED_STAT_COLS.has(statCol)) {
    throw new Error(`Invalid stat column: ${statCol}`);
  }

  return `
    WITH ranked AS (
      SELECT
        ps.season_id,
        ps.bref_player_id,
        ps.team_abbrev,
        ps.g,
        ROUND(CAST(ps.${statCol} AS FLOAT) / ps.g, 1) AS stat_value,
        ROW_NUMBER() OVER (
          PARTITION BY ps.season_id
          ORDER BY CAST(ps.${statCol} AS FLOAT) / ps.g DESC
        ) AS rn
      FROM fact_player_season_stats ps
      WHERE ps.lg = 'NBA'
        AND ps.g >= 25
        AND ps.team_abbrev IS NOT NULL
    )
    SELECT
      r.season_id,
      s.start_year,
      s.end_year,
      p.bref_id,
      p.full_name,
      t.bref_abbrev AS team_abbrev,
      r.stat_value,
      r.g AS games
    FROM ranked r
    JOIN dim_season s ON s.season_id = r.season_id
    JOIN dim_player p ON p.bref_id = r.bref_player_id
    LEFT JOIN dim_team t ON t.bref_abbrev = r.team_abbrev
    WHERE r.rn = 1
    ORDER BY s.start_year DESC`;
}

/**
 * Get the scoring champion (highest PPG) for each NBA season.
 *
 * @returns Array of per-season scoring leaders ordered newest first
 */
export function getScoringLeaders(): StatLeaderRow[] {
  return getCachedQueryMany<StatLeaderRow[]>(buildStatLeaderSQL('pts'), [], 60_000);
}

/**
 * Get the assists leader (highest APG) for each NBA season.
 *
 * @returns Array of per-season assists leaders ordered newest first
 */
export function getAssistsLeaders(): StatLeaderRow[] {
  return getCachedQueryMany<StatLeaderRow[]>(buildStatLeaderSQL('ast'), [], 60_000);
}

/**
 * Get the steals leader (highest SPG) for each NBA season.
 *
 * @returns Array of per-season steals leaders ordered newest first
 */
export function getStealsLeaders(): StatLeaderRow[] {
  return getCachedQueryMany<StatLeaderRow[]>(buildStatLeaderSQL('stl'), [], 60_000);
}

/**
 * Get the blocks leader (highest BPG) for each NBA season.
 *
 * @returns Array of per-season blocks leaders ordered newest first
 */
export function getBlocksLeaders(): StatLeaderRow[] {
  return getCachedQueryMany<StatLeaderRow[]>(buildStatLeaderSQL('blk'), [], 60_000);
}

/**
 * Get the rebounds leader (highest RPG) for each NBA season.
 *
 * @returns Array of per-season rebounds leaders ordered newest first
 */
export function getReboundsLeaders(): StatLeaderRow[] {
  return getCachedQueryMany<StatLeaderRow[]>(buildStatLeaderSQL('reb'), [], 60_000);
}
