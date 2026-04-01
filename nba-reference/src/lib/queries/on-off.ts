/**
 * @fileoverview On/Off court analysis queries.
 *
 * Returns per-player net rating impact when on vs. off the court, sourced
 * from `fact_on_off` (which is derived from `fact_player_pbp_season`).
 *
 * @module @/lib/queries/on-off
 */

import { getCachedQueryMany } from '@/lib/db';

/**
 * Retrieves on/off court analysis for all players on a team in a given season.
 *
 * @param teamId   - Internal team ID (e.g. "1610612747")
 * @param seasonId - Season identifier (e.g. "2024-25")
 * @returns Array of on/off records ordered by net impact (descending).
 *          Each record contains player name, minutes, on/off ratings, and net impact.
 */
export function getTeamOnOff(
  teamId: string,
  seasonId: string
): Array<Record<string, string | number | null>> {
  return getCachedQueryMany<Array<Record<string, string | number | null>>>(
    `SELECT
       p.bref_id,
       p.full_name,
       oo.on_court_minutes   AS mp,
       oo.on_net_rating,
       oo.off_net_rating,
       oo.net_impact
     FROM fact_on_off oo
     JOIN dim_player p ON p.bref_id = oo.bref_player_id
     WHERE oo.team_id  = ?
       AND oo.season_id = ?
     ORDER BY oo.net_impact DESC NULLS LAST`,
    [teamId, seasonId],
    60_000
  );
}
