/**
 * @fileoverview Player profile queries - basic player information and metadata.
 *
 * @module @/lib/queries/players/profile
 */

import { getDb } from '@/lib/db';

/**
 * Shape of a player profile record returned from the database.
 */
export interface PlayerProfile {
  player_id: string;
  bref_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  birth_date: string | null;
  birth_city: string | null;
  birth_country: string | null;
  college: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  is_active: number;
  hof: number;
}

/**
 * Fetches a player's profile by Basketball-Reference ID.
 *
 * If the stored position is null or empty, uses the most recent non-empty position from the player's season stats.
 *
 * @param brefId - Basketball-Reference player ID (e.g., "jamesle01")
 * @returns The player record matching `brefId`, or `undefined` if not found
 *
 * @example
 * const player = getPlayerByBrefId('jamesle01');
 * if (player) {
 *   console.log(player.full_name); // "LeBron James"
 *   console.log(player.position);  // "SF"
 * }
 */
export function getPlayerByBrefId(brefId: string): PlayerProfile | undefined {
  return getDb()
    .prepare(
      `SELECT player_id, bref_id, full_name, first_name, last_name,
              COALESCE(
                NULLIF(position, ''),
                (
                  -- Fallback: get most recent non-null/non-empty position from stats
                  SELECT fps.pos
                  FROM fact_player_season_stats fps
                  WHERE fps.bref_player_id = dim_player.bref_id
                    AND fps.pos IS NOT NULL
                    AND fps.pos <> ''
                  ORDER BY fps.season_id DESC
                  LIMIT 1
                )
              ) AS position,
              height_cm, weight_kg, birth_date, birth_city, birth_country,
              college, draft_year, draft_round, draft_number, is_active, hof
       FROM dim_player
       WHERE bref_id = ?`
    )
    .get(brefId) as PlayerProfile | undefined;
}
