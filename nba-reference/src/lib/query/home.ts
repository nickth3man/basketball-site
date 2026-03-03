/**
 * @fileoverview Homepage data queries - aggregates data for the main landing page.
 * 
 * This module provides cached queries specifically for the homepage:
 * - Team standings for the latest season
 * - Recent completed games
 * 
 * Uses longer cache TTLs than standard queries since homepage data
 * changes less frequently than individual entity pages.
 * 
 * @module @/lib/query/home
 */

import {
  getCachedQueryMany,
  getCachedQueryOne,
  getLatestSeasonId,
} from "@/lib/db";

/**
 * Represents a team standing row for the homepage table.
 */
export type TeamStandingRow = {
  /** Season ID (e.g., "2024-25") */
  season_id: string;
  /** Team abbreviation */
  bref_abbrev: string;
  /** Wins */
  w: number | null;
  /** Losses */
  l: number | null;
  /** Net rating (offensive rating - defensive rating) */
  n_rtg: number | null;
  /** Possessions per 48 minutes */
  pace: number | null;
};

/**
 * Represents a recent game row for the homepage table.
 */
export type RecentGameRow = {
  /** Game ID */
  game_id: string;
  /** Game date (YYYY-MM-DD format) */
  game_date: string;
  /** Home team abbreviation */
  home_abbrev: string;
  /** Away team abbreviation */
  away_abbrev: string;
  /** Home team final score (null if not completed) */
  home_score: number | null;
  /** Away team final score (null if not completed) */
  away_score: number | null;
};

/**
 * Retrieves team standings for the most recent season with team data.
 * 
 * First queries for the latest season with team season data, then
 * fetches standings for that season. Falls back to getLatestSeasonId()
 * if no team data exists.
 * 
 * Cache TTL: 60s for season detection, 20s for standings data.
 * 
 * @param limit - Maximum number of teams to return (default: 15)
 * @returns Array of team standing records, sorted by wins
 * @example
 * ```ts
 * const standings = getHomeStandings(30); // Top 30 teams
 * ```
 */
export function getHomeStandings(limit = 15): TeamStandingRow[] {
  const latestWithTeamData = getCachedQueryOne<
    { season_id: string } | undefined
  >(
    "SELECT season_id FROM fact_team_season ORDER BY season_id DESC LIMIT 1",
    [],
    60_000,
  );
  const seasonId = latestWithTeamData?.season_id ?? getLatestSeasonId();

  return getCachedQueryMany<TeamStandingRow[]>(
    `SELECT season_id, bref_abbrev, w, l, n_rtg, pace
     FROM fact_team_season
     WHERE season_id = ?
     ORDER BY w DESC, l ASC
     LIMIT ?`,
    [seasonId, limit],
    20_000,
  );
}

/**
 * Retrieves the most recent completed games.
 * 
 * Only returns games with final scores (home_score and away_score not null).
 * Joins with dim_team to get team abbreviations.
 * 
 * Cache TTL: 15s (games complete frequently during season).
 * 
 * @param limit - Maximum number of games to return (default: 12)
 * @returns Array of recent game records, ordered by date (newest first)
 * @example
 * ```ts
 * const games = getRecentGames(20); // Last 20 games
 * ```
 */
export function getRecentGames(limit = 12): RecentGameRow[] {
  return getCachedQueryMany<RecentGameRow[]>(
    `SELECT g.game_id, g.game_date,
            ht.abbreviation as home_abbrev,
            at.abbreviation as away_abbrev,
            g.home_score, g.away_score
     FROM fact_game g
     JOIN dim_team ht ON ht.team_id = g.home_team_id
     JOIN dim_team at ON at.team_id = g.away_team_id
     WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL
     ORDER BY g.game_date DESC
     LIMIT ?`,
    [limit],
    15_000,
  );
}
