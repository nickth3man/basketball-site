/**
 * @fileoverview G-League query functions.
 * Since the DB does not yet contain G-League data, these queries will return empty arrays or null.
 * All queries filter by lg = 'GLEAGUE'.
 * @module @/lib/queries/gleague
 */

import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';
import type { PlayerDirectoryRow, TeamDirectoryRow } from '@/lib/query/directory';

/**
 * Represents a row in the G-League season leaders query result.
 */
export interface GLeagueLeaderRow {
  bref_id: string;
  full_name: string;
  team: string | null;
  g: number;
  stat_total: number | null;
  stat_per_game: number | null;
}

/**
 * Retrieves a paginated list of G-League players for the directory.
 * Returns empty array until G-League data is populated in the database.
 *
 * @param limit - Maximum number of players to return (default: 400)
 * @param offset - Number of records to skip (default: 0)
 * @returns Array of player directory records
 */
export function getGLeaguePlayerDirectory(limit = 400, offset = 0): PlayerDirectoryRow[] {
  return getCachedQueryMany<PlayerDirectoryRow[]>(
    `SELECT p.bref_id, p.full_name, p.position, p.is_active
     FROM dim_player p
     WHERE p.bref_id IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM fact_player_season_stats fps
         WHERE fps.bref_player_id = p.bref_id
           AND fps.lg = 'GLEAGUE'
       )
     ORDER BY is_active DESC, full_name ASC
     LIMIT ?
     OFFSET ?`,
    [limit, offset],
    60_000
  );
}

/**
 * Returns the total count of G-League players, optionally filtered by first letter of bref_id.
 *
 * @param letter - Optional single letter to filter by (a-z)
 * @returns Total count of matching players
 */
export function getGLeaguePlayerDirectoryCount(letter?: string): number {
  const normalizedLetter = letter?.trim().toLowerCase();
  if (
    normalizedLetter != null &&
    normalizedLetter.length > 0 &&
    !/^[a-z]$/.test(normalizedLetter)
  ) {
    return 0;
  }

  const letterFilter =
    normalizedLetter == null || normalizedLetter.length === 0
      ? ''
      : 'AND LOWER(SUBSTR(p.bref_id, 1, 1)) = ?';
  const params =
    normalizedLetter == null || normalizedLetter.length === 0 ? [] : [normalizedLetter];

  const row = getCachedQueryOne<{ count: number } | undefined>(
    `SELECT COUNT(*) AS count
     FROM dim_player p
     WHERE p.bref_id IS NOT NULL
       ${letterFilter}
       AND EXISTS (
         SELECT 1
         FROM fact_player_season_stats fps
         WHERE fps.bref_player_id = p.bref_id
           AND fps.lg = 'GLEAGUE'
       )`,
    params,
    60_000
  );

  return row?.count ?? 0;
}

/**
 * Retrieves the complete list of G-League teams for the directory.
 *
 * @returns Array of team directory records
 */
export function getGLeagueTeamDirectory(): TeamDirectoryRow[] {
  return getCachedQueryMany<TeamDirectoryRow[]>(
    `SELECT t.abbreviation, t.full_name, t.conference, t.division
     FROM dim_team t
     WHERE EXISTS (
       SELECT 1
       FROM fact_team_season ts
       WHERE ts.bref_abbrev = t.bref_abbrev
         AND ts.lg = 'GLEAGUE'
     )
     ORDER BY t.full_name ASC`,
    [],
    60_000
  );
}

/**
 * Retrieves the most recent G-League season ID from the database.
 *
 * @returns The latest season ID string, or null if no G-League data exists
 */
export function getGLeagueLatestSeasonId(): string | null {
  const row = getCachedQueryOne<{ season_id: string } | undefined>(
    `SELECT season_id
     FROM fact_player_season_stats
     WHERE lg = 'GLEAGUE'
     ORDER BY season_id DESC
     LIMIT 1`,
    [],
    60_000
  );
  return row?.season_id ?? null;
}

/** Allowed stat columns for G-League season leaders. */
export type GLeagueLeaderStat = 'pts' | 'reb' | 'ast' | 'stl' | 'blk';

const GLEAGUE_STAT_COLUMNS: Record<GLeagueLeaderStat, string> = {
  pts: 'pts',
  reb: 'reb',
  ast: 'ast',
  stl: 'stl',
  blk: 'blk',
};

/**
 * Retrieves per-game stat leaders for a G-League season.
 *
 * @param seasonId - The season ID to retrieve leaders for
 * @param stat - The stat column to rank by ('pts', 'reb', 'ast', 'stl', or 'blk')
 * @param minGames - Minimum games played threshold
 * @param limit - Maximum number of leaders to return
 * @returns Array of leader rows
 */
export function getGLeagueSeasonLeaders(
  seasonId: string,
  stat: GLeagueLeaderStat,
  minGames = 10,
  limit = 25
): GLeagueLeaderRow[] {
  const statCol = GLEAGUE_STAT_COLUMNS[stat];

  return getCachedQueryMany<GLeagueLeaderRow[]>(
    `SELECT p.bref_id,
            p.full_name,
            GROUP_CONCAT(DISTINCT fpss.team_abbrev) AS team,
            SUM(fpss.g) AS g,
            SUM(fpss.${statCol}) AS stat_total,
            ROUND(1.0 * SUM(fpss.${statCol}) / SUM(fpss.g), 1) AS stat_per_game
     FROM fact_player_season_stats fpss
     JOIN dim_player p ON p.bref_id = fpss.bref_player_id
     WHERE fpss.season_id = ?
       AND fpss.lg = 'GLEAGUE'
       AND fpss.team_abbrev NOT LIKE '%TM'
     GROUP BY p.bref_id, p.full_name
     HAVING SUM(fpss.g) >= ?
     ORDER BY stat_per_game DESC, stat_total DESC
     LIMIT ?`,
    [seasonId, minGames, limit],
    60_000
  );
}
