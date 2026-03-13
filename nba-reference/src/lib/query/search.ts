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
  [key: string]: string | number | null;
  /** Entity type: "player" or "team" */
  type: 'player' | 'team';
  /** Entity ID (player bref_id or team abbreviation) */
  id: string;
  /** Display label (full name) */
  label: string;
}

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
  const likeQuery = `%${normalized}%`;

  // Search players by name (cached for 5s)
  const players = getCachedQueryMany<Array<{ type: 'player'; id: string; label: string }>>(
    `SELECT 'player' as type, p.bref_id as id, p.full_name as label
     FROM dim_player p
     WHERE p.bref_id IS NOT NULL
       AND LOWER(p.full_name) LIKE ?
       AND EXISTS (
         SELECT 1
         FROM fact_player_season_stats fps
         WHERE fps.bref_player_id = p.bref_id
           AND fps.lg = 'NBA'
       )
     LIMIT 10`,
    [likeQuery],
    5_000
  );

  // Search teams by name or abbreviation (cached for 5s)
  const teams = getCachedQueryMany<Array<{ type: 'team'; id: string; label: string }>>(
    `SELECT 'team' as type, t.abbreviation as id, t.full_name as label
     FROM dim_team t
     WHERE (LOWER(t.full_name) LIKE ? OR LOWER(t.abbreviation) LIKE ?)
       AND EXISTS (
         SELECT 1
         FROM fact_team_season ts
         WHERE ts.bref_abbrev = t.bref_abbrev
           AND ts.lg = 'NBA'
       )
     LIMIT 10`,
    [likeQuery, likeQuery],
    5_000
  );

  // Combine and limit total results
  return [...players, ...teams].slice(0, 12);
}
