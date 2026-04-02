/**
 * @fileoverview International basketball query functions.
 * Since the DB does not yet contain international data, these queries will return empty arrays or null.
 * All queries filter by lg NOT IN ('NBA', 'ABA', 'BAA', 'WNBA', 'GLEAGUE', 'COLLEGE'), or optionally a specific league.
 * @module @/lib/queries/international
 */

import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';
import type { PlayerDirectoryRow, TeamDirectoryRow } from '@/lib/query/directory';

/**
 * Represents a row in the international basketball season leaders query result.
 */
export interface InternationalLeaderRow {
  bref_id: string;
  full_name: string;
  team: string | null;
  g: number;
  stat_total: number | null;
  stat_per_game: number | null;
}

/**
 * Retrieves a paginated list of international basketball players for the directory.
 * Returns empty array until international data is populated in the database.
 *
 * @param limit - Maximum number of players to return (default: 400)
 * @param offset - Number of records to skip (default: 0)
 * @param leagueName - Optional specific league to filter by (e.g., 'EuroLeague')
 * @returns Array of player directory records
 */
export function getInternationalPlayerDirectory(
  limit = 400,
  offset = 0,
  leagueName?: string
): PlayerDirectoryRow[] {
  if (leagueName != null) {
    return getCachedQueryMany<PlayerDirectoryRow[]>(
      `SELECT p.bref_id, p.full_name, p.position, p.is_active
       FROM dim_player p
       WHERE p.bref_id IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM fact_player_season_stats fps
           WHERE fps.bref_player_id = p.bref_id
             AND fps.lg = ?
         )
       ORDER BY is_active DESC, full_name ASC
       LIMIT ? OFFSET ?`,
      [leagueName, limit, offset],
      60_000
    );
  }
  return getCachedQueryMany<PlayerDirectoryRow[]>(
    `SELECT p.bref_id, p.full_name, p.position, p.is_active
     FROM dim_player p
     WHERE p.bref_id IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM fact_player_season_stats fps
         WHERE fps.bref_player_id = p.bref_id
           AND fps.lg NOT IN ('NBA', 'ABA', 'BAA', 'WNBA', 'GLEAGUE', 'COLLEGE')
       )
     ORDER BY is_active DESC, full_name ASC
     LIMIT ? OFFSET ?`,
    [limit, offset],
    60_000
  );
}

/**
 * Returns the total count of international basketball players, optionally filtered by first letter of bref_id.
 *
 * @param letter - Optional single letter to filter by (a-z)
 * @param leagueName - Optional specific league to filter by
 * @returns Total count of matching players
 */
export function getInternationalPlayerDirectoryCount(letter?: string, leagueName?: string): number {
  const normalizedLetter = letter?.trim().toLowerCase();
  if (
    normalizedLetter != null &&
    normalizedLetter.length > 0 &&
    !/^[a-z]$/.test(normalizedLetter)
  ) {
    return 0;
  }

  const hasLetter = normalizedLetter != null && normalizedLetter.length > 0;
  const letterFilter = hasLetter ? 'AND LOWER(SUBSTR(p.bref_id, 1, 1)) = ?' : '';

  if (leagueName != null) {
    const params: unknown[] = hasLetter ? [normalizedLetter] : [];
    params.push(leagueName);
    const row = getCachedQueryOne<{ count: number } | undefined>(
      `SELECT COUNT(*) AS count
       FROM dim_player p
       WHERE p.bref_id IS NOT NULL
         ${letterFilter}
         AND EXISTS (
           SELECT 1
           FROM fact_player_season_stats fps
           WHERE fps.bref_player_id = p.bref_id
             AND fps.lg = ?
         )`,
      params,
      60_000
    );
    return row?.count ?? 0;
  }

  const params: unknown[] = hasLetter ? [normalizedLetter] : [];
  const row = getCachedQueryOne<{ count: number } | undefined>(
    `SELECT COUNT(*) AS count
     FROM dim_player p
     WHERE p.bref_id IS NOT NULL
       ${letterFilter}
       AND EXISTS (
         SELECT 1
         FROM fact_player_season_stats fps
         WHERE fps.bref_player_id = p.bref_id
           AND fps.lg NOT IN ('NBA', 'ABA', 'BAA', 'WNBA', 'GLEAGUE', 'COLLEGE')
       )`,
    params,
    60_000
  );

  return row?.count ?? 0;
}

/**
 * Retrieves the complete list of international basketball teams for the directory.
 *
 * @param leagueName - Optional specific league to filter by
 * @returns Array of team directory records
 */
export function getInternationalTeamDirectory(leagueName?: string): TeamDirectoryRow[] {
  if (leagueName != null) {
    return getCachedQueryMany<TeamDirectoryRow[]>(
      `SELECT t.abbreviation, t.full_name, t.conference, t.division
       FROM dim_team t
       WHERE EXISTS (
         SELECT 1
         FROM fact_team_season ts
         WHERE ts.bref_abbrev = t.bref_abbrev
           AND ts.lg = ?
       )
       ORDER BY t.full_name ASC`,
      [leagueName],
      60_000
    );
  }
  return getCachedQueryMany<TeamDirectoryRow[]>(
    `SELECT t.abbreviation, t.full_name, t.conference, t.division
     FROM dim_team t
     WHERE EXISTS (
       SELECT 1
       FROM fact_team_season ts
       WHERE ts.bref_abbrev = t.bref_abbrev
         AND ts.lg NOT IN ('NBA', 'ABA', 'BAA', 'WNBA', 'GLEAGUE', 'COLLEGE')
     )
     ORDER BY t.full_name ASC`,
    [],
    60_000
  );
}

/**
 * Retrieves the most recent international basketball season ID from the database.
 *
 * @param leagueName - Optional specific league to filter by
 * @returns The latest season ID string, or null if no international data exists
 */
export function getInternationalLatestSeasonId(leagueName?: string): string | null {
  if (leagueName != null) {
    const row = getCachedQueryOne<{ season_id: string } | undefined>(
      `SELECT season_id
       FROM fact_player_season_stats
       WHERE lg = ?
       ORDER BY season_id DESC
       LIMIT 1`,
      [leagueName],
      60_000
    );
    return row?.season_id ?? null;
  }
  const row = getCachedQueryOne<{ season_id: string } | undefined>(
    `SELECT season_id
     FROM fact_player_season_stats
     WHERE lg NOT IN ('NBA', 'ABA', 'BAA', 'WNBA', 'GLEAGUE', 'COLLEGE')
     ORDER BY season_id DESC
     LIMIT 1`,
    [],
    60_000
  );
  return row?.season_id ?? null;
}

/** Allowed stat columns for international basketball season leaders. */
export type InternationalLeaderStat = 'pts' | 'reb' | 'ast' | 'stl' | 'blk';

const INTL_STAT_COLUMNS: Record<InternationalLeaderStat, string> = {
  pts: 'pts',
  reb: 'reb',
  ast: 'ast',
  stl: 'stl',
  blk: 'blk',
};

/**
 * Retrieves per-game stat leaders for an international basketball season.
 *
 * @param seasonId - The season ID to retrieve leaders for
 * @param stat - The stat column to rank by ('pts', 'reb', 'ast', 'stl', or 'blk')
 * @param minGames - Minimum games played threshold
 * @param limit - Maximum number of leaders to return
 * @param leagueName - Optional specific league to filter by
 * @returns Array of leader rows
 */
export function getInternationalSeasonLeaders(
  seasonId: string,
  stat: InternationalLeaderStat,
  minGames = 10,
  limit = 25,
  leagueName?: string
): InternationalLeaderRow[] {
  const statCol = INTL_STAT_COLUMNS[stat];

  if (leagueName != null) {
    return getCachedQueryMany<InternationalLeaderRow[]>(
      `SELECT p.bref_id,
              p.full_name,
              GROUP_CONCAT(DISTINCT fpss.team_abbrev) AS team,
              SUM(fpss.g) AS g,
              SUM(fpss.${statCol}) AS stat_total,
              ROUND(1.0 * SUM(fpss.${statCol}) / SUM(fpss.g), 1) AS stat_per_game
       FROM fact_player_season_stats fpss
       JOIN dim_player p ON p.bref_id = fpss.bref_player_id
       WHERE fpss.season_id = ?
         AND fpss.lg = ?
         AND fpss.team_abbrev NOT LIKE '%TM'
       GROUP BY p.bref_id, p.full_name
       HAVING SUM(fpss.g) >= ?
       ORDER BY stat_per_game DESC, stat_total DESC
       LIMIT ?`,
      [seasonId, leagueName, minGames, limit],
      60_000
    );
  }

  return getCachedQueryMany<InternationalLeaderRow[]>(
    `SELECT p.bref_id,
            p.full_name,
            GROUP_CONCAT(DISTINCT fpss.team_abbrev) AS team,
            SUM(fpss.g) AS g,
            SUM(fpss.${statCol}) AS stat_total,
            ROUND(1.0 * SUM(fpss.${statCol}) / SUM(fpss.g), 1) AS stat_per_game
     FROM fact_player_season_stats fpss
     JOIN dim_player p ON p.bref_id = fpss.bref_player_id
     WHERE fpss.season_id = ?
       AND fpss.lg NOT IN ('NBA', 'ABA', 'BAA', 'WNBA', 'GLEAGUE', 'COLLEGE')
       AND fpss.team_abbrev NOT LIKE '%TM'
     GROUP BY p.bref_id, p.full_name
     HAVING SUM(fpss.g) >= ?
     ORDER BY stat_per_game DESC, stat_total DESC
     LIMIT ?`,
    [seasonId, minGames, limit],
    60_000
  );
}
