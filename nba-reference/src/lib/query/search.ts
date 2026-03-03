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

import { getCachedQueryMany } from '@/lib/db';

/**
 * Represents a search result entity.
 */
export interface SearchEntityResult {
  /** Entity type: "player" or "team" */
  type: 'player' | 'team';
  /** Entity ID (player bref_id or team abbreviation) */
  id: string;
  /** Display label (full name) */
  label: string;
};

/**
 * Find players and teams whose names or abbreviations partially match the query.
 *
 * Performs case-insensitive partial matching against player full names and team full names and abbreviations, combines player and team results, and returns up to 12 total matches. Results for identical queries are cached for 5 seconds.
 *
 * @param query - Search string to match against names or abbreviations
 * @returns An array of search results where each item has `type` ("player" | "team"), `id` (player bref_id or team abbreviation), and `label` (display name)
 */
export function searchEntities(query: string): SearchEntityResult[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];
  const q = `%${normalized}%`;

  // Search players by name (cached for 5s)
  const players = getCachedQueryMany<{ type: 'player'; id: string; label: string }[]>(
    `SELECT 'player' as type, bref_id as id, full_name as label
     FROM dim_player
     WHERE bref_id IS NOT NULL AND LOWER(full_name) LIKE ?
     LIMIT 10`,
    [q],
    5_000
  );

  // Search teams by name or abbreviation (cached for 5s)
  const teams = getCachedQueryMany<{ type: 'team'; id: string; label: string }[]>(
    `SELECT 'team' as type, abbreviation as id, full_name as label
     FROM dim_team
     WHERE LOWER(full_name) LIKE ? OR LOWER(abbreviation) LIKE ?
     LIMIT 10`,
    [q, q],
    5_000
  );

  // Combine and limit total results
  return [...players, ...teams].slice(0, 12);
}
