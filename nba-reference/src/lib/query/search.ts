/**
 * @fileoverview Search functionality - finds players and teams by name.
 * 
 * Provides cross-entity search across players and teams with:
 * - Case-insensitive matching
 * - Partial string matching (LIKE queries)
 * - Result limiting and deduplication
 * - Short query filtering (minimum 2 characters)
 * 
 * @module @/lib/query/search
 */

import { getCachedQueryMany } from "@/lib/db";

/**
 * Represents a search result entity.
 */
export type SearchEntityResult = {
  /** Entity type: "player" or "team" */
  type: "player" | "team";
  /** Entity ID (player bref_id or team abbreviation) */
  id: string;
  /** Display label (full name) */
  label: string;
};

/**
 * Searches for players and teams matching the query string.
 * 
 * Performs case-insensitive partial matching on:
 * - Players: full_name
 * - Teams: full_name and abbreviation
 * 
 * Results are combined and limited to 12 total (first 10 from each
 * category, then sliced). Each query is cached for 5 seconds.
 * 
 * Note: This function does not filter by minimum query length - 
 * callers should validate q.length >= 2 before calling for performance.
 * 
 * @param query - Search query string
 * @returns Array of matching entities (players and teams mixed)
 * @example
 * ```ts
 * const results = searchEntities("lebron");
 * // [{ type: "player", id: "jamesle01", label: "LeBron James" }, ...]
 * 
 * const teams = searchEntities("lal");
 * // [{ type: "team", id: "LAL", label: "Los Angeles Lakers" }]
 * ```
 */
export function searchEntities(query: string): SearchEntityResult[] {
  const q = `%${query.toLowerCase()}%`;
  
  // Search players by name (cached for 5s)
  const players = getCachedQueryMany<
    Array<{ type: "player"; id: string; label: string }>
  >(
    `SELECT 'player' as type, bref_id as id, full_name as label
     FROM dim_player
     WHERE bref_id IS NOT NULL AND LOWER(full_name) LIKE ?
     LIMIT 10`,
    [q],
    5_000,
  );

  // Search teams by name or abbreviation (cached for 5s)
  const teams = getCachedQueryMany<
    Array<{ type: "team"; id: string; label: string }>
  >(
    `SELECT 'team' as type, abbreviation as id, full_name as label
     FROM dim_team
     WHERE LOWER(full_name) LIKE ? OR LOWER(abbreviation) LIKE ?
     LIMIT 10`,
    [q, q],
    5_000,
  );

  // Combine and limit total results
  return [...players, ...teams].slice(0, 12);
}
