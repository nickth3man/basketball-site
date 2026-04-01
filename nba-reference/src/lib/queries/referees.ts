/**
 * @fileoverview Referee data queries - retrieves referee information and career statistics.
 *
 * This module provides query functions for referee data:
 * - Basic referee information (name, career start, active status)
 * - Per-game referee assignments with roles
 * - Career statistics (games officiated)
 * - Paginated referee directory
 *
 * All queries use the cached database layer (30s TTL) for performance.
 *
 * Requires the `dim_referee` and `fact_game_referee` tables created by
 * `db/migrations/001_add_referee_tables.sql`. Functions return empty/undefined
 * results gracefully when the tables have not yet been migrated.
 *
 * @module @/lib/queries/referees
 */

import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';

/**
 * Retrieve a single referee by their ID.
 *
 * @param refereeId - Referee identifier
 * @returns A record with referee fields or `undefined` if not found
 */
export function getRefereeById(
  refereeId: string | number
): Record<string, string | number | null> | undefined {
  try {
    return getCachedQueryOne<Record<string, string | number | null> | undefined>(
      `SELECT referee_id, first_name, last_name, full_name, career_start_year, active
       FROM dim_referee
       WHERE referee_id = ?`,
      [refereeId],
      30_000
    );
  } catch {
    return undefined;
  }
}

/**
 * Retrieve the referees who officiated a specific game.
 *
 * Returns rows with referee_id, full_name, and role ordered so the crew chief
 * appears first, followed by other referees alphabetically.
 *
 * @param gameId - Game identifier (e.g., "0022400001")
 * @returns An array of referee records for the game
 */
export function getGameReferees(gameId: string): Array<Record<string, string | number | null>> {
  try {
    return getCachedQueryMany<Array<Record<string, string | number | null>>>(
      `SELECT r.referee_id, r.full_name, r.first_name, r.last_name, fgr.role
       FROM fact_game_referee fgr
       JOIN dim_referee r ON r.referee_id = fgr.referee_id
       WHERE fgr.game_id = ?
       ORDER BY CASE fgr.role WHEN 'crew_chief' THEN 0 ELSE 1 END ASC, r.last_name ASC`,
      [gameId],
      30_000
    );
  } catch {
    return [];
  }
}

/**
 * Retrieve career statistics for a referee.
 *
 * Returns total games officiated, games as crew chief, and games as referee.
 *
 * @param refereeId - Referee identifier
 * @returns A record with career stats or `undefined` if not found
 */
export function getRefereeCareerStats(
  refereeId: string | number
): Record<string, string | number | null> | undefined {
  try {
    return getCachedQueryOne<Record<string, string | number | null> | undefined>(
      `SELECT
         r.referee_id,
         r.full_name,
         r.career_start_year,
         r.active,
         COUNT(fgr.game_id) AS games_total,
         SUM(CASE WHEN fgr.role = 'crew_chief' THEN 1 ELSE 0 END) AS games_crew_chief,
         SUM(CASE WHEN fgr.role = 'referee' THEN 1 ELSE 0 END) AS games_referee
       FROM dim_referee r
       LEFT JOIN fact_game_referee fgr ON fgr.referee_id = r.referee_id
       WHERE r.referee_id = ?
       GROUP BY r.referee_id`,
      [refereeId],
      30_000
    );
  } catch {
    return undefined;
  }
}

/**
 * Retrieve per-season game counts for a referee.
 *
 * @param refereeId - Referee identifier
 * @returns An array of season breakdown records
 */
export function getRefereeSeasonStats(
  refereeId: string | number
): Array<Record<string, string | number | null>> {
  try {
    return getCachedQueryMany<Array<Record<string, string | number | null>>>(
      `SELECT
         g.season_id,
         COUNT(fgr.game_id) AS games_total,
         SUM(CASE WHEN fgr.role = 'crew_chief' THEN 1 ELSE 0 END) AS games_crew_chief,
         SUM(CASE WHEN fgr.role = 'referee' THEN 1 ELSE 0 END) AS games_referee
       FROM fact_game_referee fgr
       JOIN fact_game g ON g.game_id = fgr.game_id
       WHERE fgr.referee_id = ?
       GROUP BY g.season_id
       ORDER BY g.season_id DESC`,
      [refereeId],
      30_000
    );
  } catch {
    return [];
  }
}

/**
 * Retrieve a paginated list of referees for the directory.
 *
 * Sorted alphabetically by last name, then first name.
 * Includes career game counts alongside basic metadata.
 *
 * Cache TTL: 60s (referee roster changes infrequently).
 *
 * @param limit - Maximum number of referees to return (default: 50)
 * @param offset - Number of rows to skip for pagination (default: 0)
 * @returns Array of referee directory records
 */
export function getRefereeDirectory(
  limit = 50,
  offset = 0
): Array<Record<string, string | number | null>> {
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(Number.isFinite(limit) ? limit : 50)));
  const safeOffset = Math.max(0, Math.trunc(Number.isFinite(offset) ? offset : 0));

  try {
    return getCachedQueryMany<Array<Record<string, string | number | null>>>(
      `SELECT
         r.referee_id,
         r.full_name,
         r.first_name,
         r.last_name,
         r.career_start_year,
         r.active,
         COUNT(fgr.game_id) AS games_total
       FROM dim_referee r
       LEFT JOIN fact_game_referee fgr ON fgr.referee_id = r.referee_id
       GROUP BY r.referee_id
       ORDER BY r.last_name ASC, r.first_name ASC
       LIMIT ?
       OFFSET ?`,
      [safeLimit, safeOffset],
      60_000
    );
  } catch {
    return [];
  }
}

/**
 * Count the total number of referees in the directory.
 *
 * @returns Total referee count
 */
export function getRefereeDirectoryCount(): number {
  try {
    const row = getCachedQueryOne<{ count: number }>(
      `SELECT COUNT(*) AS count FROM dim_referee`,
      [],
      60_000
    );
    return row.count;
  } catch {
    return 0;
  }
}
