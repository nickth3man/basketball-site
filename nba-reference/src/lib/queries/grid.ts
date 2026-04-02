/**
 * @fileoverview Database queries for the Immaculate Grid game.
 *
 * Provides functions to:
 * - Search NBA players by name (for autocomplete in the grid UI)
 * - Validate whether a player satisfies a specific grid criterion
 *
 * All validation queries run against the read-only main NBA database.
 * Per-game stats are computed from season totals (pts/g, reb/g, ast/g).
 *
 * @module @/lib/queries/grid
 */

import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';
import type { GridCriteria } from '@/lib/puzzles/types';

/** A player search result for grid autocomplete */
export interface GridPlayerResult {
  bref_id: string;
  full_name: string;
  position: string | null;
}

/**
 * Search NBA players by name fragment for grid autocomplete.
 *
 * @param query - Partial player name (minimum 2 characters)
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of matching player records
 */
export function searchGridPlayers(query: string, limit = 10): GridPlayerResult[] {
  if (query.length < 2) {
    return [];
  }
  const pattern = `%${query}%`;
  return getCachedQueryMany<GridPlayerResult[]>(
    `SELECT p.bref_id, p.full_name, p.position
     FROM dim_player p
     WHERE p.full_name LIKE ?
       AND EXISTS (
         SELECT 1 FROM fact_player_season_stats fps
         WHERE fps.bref_player_id = p.bref_id
           AND (fps.lg = 'NBA' OR fps.lg IS NULL)
       )
     ORDER BY p.full_name
     LIMIT ?`,
    [pattern, limit],
    30_000
  );
}

/**
 * Look up a player's bref_id and full_name by their bref_id.
 *
 * @param brefId - Basketball-Reference player ID
 * @returns Player record or undefined if not found
 */
export function getGridPlayerById(brefId: string): GridPlayerResult | undefined {
  return getCachedQueryOne<GridPlayerResult | undefined>(
    `SELECT p.bref_id, p.full_name, p.position
     FROM dim_player p
     WHERE p.bref_id = ?`,
    [brefId],
    60_000
  );
}

/**
 * Validate whether a player (identified by `brefId`) satisfies the given grid criterion.
 *
 * @param brefId - Basketball-Reference player ID
 * @param criteria - The criterion to check
 * @returns `true` if the player satisfies the criterion, `false` otherwise
 */
export function validatePlayerCriteria(brefId: string, criteria: GridCriteria): boolean {
  switch (criteria.type) {
    case 'team':
      return validateTeamCriteria(brefId, criteria.teamAbbrev);
    case 'award':
      return validateAwardCriteria(brefId, criteria.awardName);
    case 'stat_ppg':
      return validateStatPpgCriteria(brefId, criteria.minValue);
    case 'stat_rpg':
      return validateStatRpgCriteria(brefId, criteria.minValue);
    case 'stat_apg':
      return validateStatApgCriteria(brefId, criteria.minValue);
    case 'hof':
      return validateHofCriteria(brefId);
    case 'all_nba':
      return validateAllNbaCriteria(brefId);
  }
  return false;
}

/** Check if a player has appeared in at least one NBA season for the given team */
function validateTeamCriteria(brefId: string, teamAbbrev: string): boolean {
  const result = getCachedQueryOne<{ found: number } | undefined>(
    `SELECT 1 AS found
     FROM fact_player_season_stats
     WHERE bref_player_id = ?
       AND team_abbrev = ?
       AND (lg = 'NBA' OR lg IS NULL)
     LIMIT 1`,
    [brefId, teamAbbrev],
    60_000
  );
  return result?.found === 1;
}

/** Check if a player has won a specific award at least once */
function validateAwardCriteria(brefId: string, awardName: string): boolean {
  const result = getCachedQueryOne<{ found: number } | undefined>(
    `SELECT 1 AS found
     FROM fact_player_award
     WHERE player_id = ?
       AND award_name = ?
     LIMIT 1`,
    [brefId, awardName],
    60_000
  );
  return result?.found === 1;
}

/**
 * Check if a player has averaged at least `minPpg` points per game in any NBA season.
 * Per-game value is computed from season totals (pts / g).
 */
function validateStatPpgCriteria(brefId: string, minPpg: number): boolean {
  const result = getCachedQueryOne<{ found: number } | undefined>(
    `SELECT 1 AS found
     FROM fact_player_season_stats
     WHERE bref_player_id = ?
       AND g > 0
       AND CAST(pts AS REAL) / g >= ?
       AND (lg = 'NBA' OR lg IS NULL)
     LIMIT 1`,
    [brefId, minPpg],
    60_000
  );
  return result?.found === 1;
}

/**
 * Check if a player has averaged at least `minRpg` rebounds per game in any NBA season.
 * Per-game value is computed from season totals (reb / g).
 */
function validateStatRpgCriteria(brefId: string, minRpg: number): boolean {
  const result = getCachedQueryOne<{ found: number } | undefined>(
    `SELECT 1 AS found
     FROM fact_player_season_stats
     WHERE bref_player_id = ?
       AND g > 0
       AND CAST(reb AS REAL) / g >= ?
       AND (lg = 'NBA' OR lg IS NULL)
     LIMIT 1`,
    [brefId, minRpg],
    60_000
  );
  return result?.found === 1;
}

/**
 * Check if a player has averaged at least `minApg` assists per game in any NBA season.
 * Per-game value is computed from season totals (ast / g).
 */
function validateStatApgCriteria(brefId: string, minApg: number): boolean {
  const result = getCachedQueryOne<{ found: number } | undefined>(
    `SELECT 1 AS found
     FROM fact_player_season_stats
     WHERE bref_player_id = ?
       AND g > 0
       AND CAST(ast AS REAL) / g >= ?
       AND (lg = 'NBA' OR lg IS NULL)
     LIMIT 1`,
    [brefId, minApg],
    60_000
  );
  return result?.found === 1;
}

/** Check if a player is in the Basketball Hall of Fame */
function validateHofCriteria(brefId: string): boolean {
  const result = getCachedQueryOne<{ found: number } | undefined>(
    `SELECT 1 AS found
     FROM dim_player
     WHERE bref_id = ?
       AND hof = 1
     LIMIT 1`,
    [brefId],
    300_000
  );
  return result?.found === 1;
}

/** Check if a player has received at least one All-NBA team selection */
function validateAllNbaCriteria(brefId: string): boolean {
  const result = getCachedQueryOne<{ found: number } | undefined>(
    `SELECT 1 AS found
     FROM fact_all_nba
     WHERE player_id = ?
       AND team_type = 'All-NBA'
     LIMIT 1`,
    [brefId],
    300_000
  );
  return result?.found === 1;
}
