/**
 * @fileoverview Lineup aggregation queries.
 *
 * Returns top 5-player lineup units per team per season from
 * `fact_lineup_aggregation`, which is populated by the ETL pipeline.
 *
 * @module @/lib/queries/lineups
 */

import { getCachedQueryMany } from '@/lib/db';

/**
 * Retrieves the top lineup units for a team in a given season, ordered by
 * net rating (best first). Returns an empty array when the ETL pipeline has
 * not yet populated lineup data.
 *
 * @param teamId   - Internal team ID (e.g. "1610612747")
 * @param seasonId - Season identifier (e.g. "2024-25")
 * @param limit    - Maximum number of lineup rows to return (default: 20)
 * @returns Array of lineup records with player ids, minutes, ratings, and
 *          possession counts. Empty when no data is available.
 */
export function getTeamLineups(
  teamId: string,
  seasonId: string,
  limit = 20
): Array<Record<string, string | number | null>> {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 100));
  return getCachedQueryMany<Array<Record<string, string | number | null>>>(
    `SELECT
       fla.lineup_id,
       fla.player_ids,
       fla.minutes,
       fla.possessions,
       fla.points_scored,
       fla.points_allowed,
       fla.net_rating,
       fla.off_rating,
       fla.def_rating
     FROM fact_lineup_aggregation fla
     WHERE fla.team_id  = ?
       AND fla.season_id = ?
     ORDER BY fla.net_rating DESC NULLS LAST
     LIMIT ?`,
    [teamId, seasonId, safeLimit],
    60_000
  );
}
