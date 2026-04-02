/**
 * @fileoverview Depth chart queries.
 *
 * Aggregates minutes played by position for a team season, providing the
 * data needed to render a visual depth chart (Recharts stacked bar/area).
 *
 * Derived from `fact_player_season_stats` — no extra ETL required.
 *
 * @module @/lib/queries/depth-chart
 */

import { getCachedQueryMany } from '@/lib/db';

/**
 * Returns per-player minutes and position data for a team season, ordered
 * by total minutes descending. This data is used to render the depth chart.
 *
 * @param teamId   - Internal team ID (e.g. "1610612747")
 * @param seasonId - Season identifier (e.g. "2024-25")
 * @returns Array of player records with position and minutes played.
 */
export function getTeamDepthChart(
  teamId: string,
  seasonId: string
): Array<Record<string, string | number | null>> {
  return getCachedQueryMany<Array<Record<string, string | number | null>>>(
    `SELECT
       p.bref_id,
       p.full_name,
       fs.pos,
       fs.g,
       fs.mp,
       CASE WHEN fs.g > 0 THEN ROUND(1.0 * fs.mp / fs.g, 1) END AS mpg
     FROM fact_player_season_stats fs
     JOIN dim_player p ON p.bref_id = fs.bref_player_id
     JOIN dim_team   dt ON dt.team_id = ?
      AND (fs.team_abbrev = dt.abbreviation OR fs.team_abbrev = dt.bref_abbrev)
     WHERE fs.season_id = ?
       AND (fs.lg = 'NBA' OR fs.lg IS NULL)
       AND fs.mp > 0
     ORDER BY fs.mp DESC`,
    [teamId, seasonId],
    60_000
  );
}

/**
 * Returns minutes totals grouped by position for a team season.
 * Used for the aggregate bar in the depth chart.
 *
 * @param teamId   - Internal team ID
 * @param seasonId - Season identifier
 * @returns Array of { pos, total_mp, player_count } ordered by canonical position order.
 */
export function getTeamDepthChartByPosition(
  teamId: string,
  seasonId: string
): Array<Record<string, string | number | null>> {
  return getCachedQueryMany<Array<Record<string, string | number | null>>>(
    `SELECT
       fs.pos,
       SUM(fs.mp)    AS total_mp,
       COUNT(*)      AS player_count
     FROM fact_player_season_stats fs
     JOIN dim_team dt ON dt.team_id = ?
      AND (fs.team_abbrev = dt.abbreviation OR fs.team_abbrev = dt.bref_abbrev)
     WHERE fs.season_id = ?
       AND (fs.lg = 'NBA' OR fs.lg IS NULL)
       AND fs.mp > 0
     GROUP BY fs.pos
     ORDER BY
       CASE fs.pos
         WHEN 'PG' THEN 1
         WHEN 'SG' THEN 2
         WHEN 'SF' THEN 3
         WHEN 'PF' THEN 4
         WHEN 'C'  THEN 5
         ELSE 6
       END`,
    [teamId, seasonId],
    60_000
  );
}
