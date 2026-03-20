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

import { getCachedQueryMany, getCachedQueryOne, getLatestSeasonId } from '@/lib/db';

/**
 * Determines the most recent season that contains team data.
 *
 * If no season with team data exists in fact_team_season, falls back to the overall latest season id.
 *
 * @returns The `season_id` of the most recent season containing team data.
 */
function getLatestSeasonWithTeamData(): string {
  const latestWithTeamData = getCachedQueryOne<{ season_id: string } | undefined>(
    'SELECT season_id FROM fact_team_season ORDER BY season_id DESC LIMIT 1',
    [],
    60_000
  );
  return latestWithTeamData?.season_id ?? getLatestSeasonId();
}

/**
 * Get the latest season_id that has team data.
 *
 * @returns The `season_id` for the most recent season containing team data
 */
export function getHomeSeasonId(): string {
  return getLatestSeasonWithTeamData();
}

/**
 * Represents a team standing row for the homepage table.
 */
export interface TeamStandingRow {
  [key: string]: string | number | null;
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
}

/**
 * Represents a recent game row for the homepage table.
 */
export interface RecentGameRow {
  [key: string]: string | number | null;
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
}

/**
 * Retrieve team standings for the most recent season that has team data.
 *
 * Returns up to `limit` team standing records for that season, ordered by wins (descending) then losses (ascending).
 *
 * @param limit - Maximum number of teams to return (default: 15)
 * @returns An array of team standing records ordered by wins descending then losses ascending
 */
export function getHomeStandings(limit = 15): TeamStandingRow[] {
  const seasonId = getLatestSeasonWithTeamData();

  return getCachedQueryMany<TeamStandingRow[]>(
    `SELECT season_id, bref_abbrev, w, l, n_rtg, pace
     FROM fact_team_season
     WHERE season_id = ?
     ORDER BY w DESC, l ASC
     LIMIT ?`,
    [seasonId, limit],
    20_000
  );
}

/**
 * Retrieve the most recent completed games for the homepage.
 *
 * Only games with final scores are included; results are ordered newest first.
 *
 * @param limit - Maximum number of games to return (default: 12)
 * @returns An array of recent game records with team abbreviations and final scores, ordered by game date descending
 */
export function getRecentGames(limit = 12, offset = 0, teamAbbrev?: string): RecentGameRow[] {
  const normalizedTeamAbbrev = teamAbbrev?.trim().toUpperCase();
  const hasTeamFilter =
    normalizedTeamAbbrev != null &&
    normalizedTeamAbbrev.length > 0 &&
    /^[A-Z]{2,4}$/.test(normalizedTeamAbbrev);
  const whereClause = hasTeamFilter
    ? `WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL
       AND (ht.abbreviation = ? OR at.abbreviation = ?)`
    : 'WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL';
  const params = hasTeamFilter
    ? [normalizedTeamAbbrev, normalizedTeamAbbrev, limit, Math.max(0, Math.floor(offset))]
    : [limit, Math.max(0, Math.floor(offset))];

  return getCachedQueryMany<RecentGameRow[]>(
    `SELECT g.game_id, g.game_date,
            ht.abbreviation as home_abbrev,
            at.abbreviation as away_abbrev,
            g.home_score, g.away_score
     FROM fact_game g
     JOIN dim_team ht ON ht.team_id = g.home_team_id
     JOIN dim_team at ON at.team_id = g.away_team_id
     ${whereClause}
     ORDER BY g.game_date DESC
     LIMIT ?
     OFFSET ?`,
    params,
    15_000
  );
}

export function getRecentGamesCount(teamAbbrev?: string): number {
  const normalizedTeamAbbrev = teamAbbrev?.trim().toUpperCase();
  const hasTeamFilter =
    normalizedTeamAbbrev != null &&
    normalizedTeamAbbrev.length > 0 &&
    /^[A-Z]{2,4}$/.test(normalizedTeamAbbrev);
  const params = hasTeamFilter ? [normalizedTeamAbbrev, normalizedTeamAbbrev] : [];
  const whereClause = hasTeamFilter
    ? `WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL
       AND (ht.abbreviation = ? OR at.abbreviation = ?)`
    : 'WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL';

  const row = getCachedQueryOne<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM fact_game g
     JOIN dim_team ht ON ht.team_id = g.home_team_id
     JOIN dim_team at ON at.team_id = g.away_team_id
     ${whereClause}`,
    params,
    15_000
  );

  return row.count;
}
