/**
 * @fileoverview Directory queries - provides paginated entity listings.
 *
 * This module provides queries for directory/listing pages:
 * - Player directory with active status
 * - Team directory with conference/division
 *
 * Uses longer cache TTLs (60s) since directory data changes infrequently.
 *
 * @module @/lib/query/directory
 */

import { getCachedQueryMany } from '@/lib/db';

/**
 * Represents a player in the directory listing.
 */
export interface PlayerDirectoryRow {
  /** Basketball-Reference player ID */
  bref_id: string;
  /** Player's full name */
  full_name: string;
  /** Primary position (e.g., "G", "F", "C") */
  position: string | null;
  /** 1 if active, 0 if retired */
  is_active: number;
}

/**
 * Represents a team in the directory listing.
 */
export interface TeamDirectoryRow {
  /** Team abbreviation */
  abbreviation: string;
  /** Team's full name (City + Nickname) */
  full_name: string;
  /** Conference ("East" or "West") */
  conference: string | null;
  /** Division name */
  division: string | null;
}

/**
 * Retrieves a paginated list of players for the directory.
 *
 * Players are sorted by:
 * 1. Active status (active players first)
 * 2. Full name (alphabetical)
 *
 * Only includes players with a valid bref_id (excludes incomplete records).
 *
 * Cache TTL: 60s (player roster changes infrequently).
 *
 * @param limit - Maximum number of players to return (default: 400)
 * @returns Array of player directory records
 * @example
 * ```ts
 * const players = getPlayerDirectory(50); // First 50 players
 * ```
 */
export function getPlayerDirectory(limit = 400): PlayerDirectoryRow[] {
  return getCachedQueryMany<PlayerDirectoryRow[]>(
    `SELECT p.bref_id, p.full_name, p.position, p.is_active
     FROM dim_player p
     WHERE p.bref_id IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM fact_player_season_stats fps
         WHERE fps.bref_player_id = p.bref_id
           AND fps.lg = 'NBA'
       )
     ORDER BY is_active DESC, full_name ASC
     LIMIT ?`,
    [limit],
    60_000
  );
}

export function getPlayerDirectoryByLetter(letter: string, limit = 400): PlayerDirectoryRow[] {
  const normalizedLetter = letter.trim().toLowerCase();
  if (!/^[a-z]$/.test(normalizedLetter)) return [];

  return getCachedQueryMany<PlayerDirectoryRow[]>(
    `SELECT p.bref_id, p.full_name, p.position, p.is_active
     FROM dim_player p
     WHERE p.bref_id IS NOT NULL
       AND LOWER(SUBSTR(p.bref_id, 1, 1)) = ?
       AND EXISTS (
         SELECT 1
         FROM fact_player_season_stats fps
         WHERE fps.bref_player_id = p.bref_id
           AND fps.lg = 'NBA'
       )
     ORDER BY is_active DESC, full_name ASC
     LIMIT ?`,
    [normalizedLetter, limit],
    60_000
  );
}

/**
 * Retrieves the complete list of teams for the directory.
 *
 * Teams are sorted alphabetically by full name.
 * Returns all teams (no pagination needed for 30 NBA teams).
 *
 * Cache TTL: 60s (team data rarely changes).
 *
 * @returns Array of team directory records
 * @example
 * ```ts
 * const teams = getTeamDirectory();
 * // [{ abbreviation: "ATL", full_name: "Atlanta Hawks", conference: "East", division: "Southeast" }, ...]
 * ```
 */
export function getTeamDirectory(): TeamDirectoryRow[] {
  return getCachedQueryMany<TeamDirectoryRow[]>(
    `SELECT t.abbreviation, t.full_name, t.conference, t.division
     FROM dim_team t
     WHERE EXISTS (
       SELECT 1
       FROM fact_team_season ts
       WHERE ts.bref_abbrev = t.bref_abbrev
         AND ts.lg = 'NBA'
     )
     ORDER BY t.full_name ASC`,
    [],
    60_000
  );
}
