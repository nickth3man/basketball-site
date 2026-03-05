/**
 * @fileoverview Awards data queries - retrieves MVP, DPOY, ROY, and All-NBA team information.
 *
 * This module provides query functions for NBA awards:
 * - MVP (Most Valuable Player) winners by season
 * - DPOY (Defensive Player of the Year) winners
 * - ROY (Rookie of the Year) winners
 * - All-NBA teams (First, Second, Third)
 * - All-Defensive teams
 * - Award voting details
 *
 * All queries use the cached database layer (60s TTL) for performance.
 *
 * @module @/lib/queries/awards
 */

import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';

/**
 * MVP winner for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns MVP winner record or undefined
 */
export function getMVPWinner(
  seasonId: string
): Record<string, string | number | null> | undefined {
  return getCachedQueryOne(
    `SELECT 
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name,
      pa.votes_received,
      pa.votes_possible,
      CASE 
        WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
        ELSE NULL
      END as vote_percentage
    FROM fact_player_award pa
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = pa.player_id
      AND ps.season_id = pa.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.season_id = ?
      AND pa.award_name = 'MVP'
    ORDER BY pa.votes_received DESC
    LIMIT 1`,
    [seasonId],
    60_000
  ) as Record<string, string | number | null> | undefined;
}

/**
 * Get all MVP winners in history.
 *
 * @returns Array of MVP winner records ordered by season (newest first)
 */
export function getMVPHistory(): Array<Record<string, string | number | null>> {
  return getCachedQueryMany(
    `SELECT 
      pa.season_id,
      s.start_year,
      s.end_year,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name,
      pa.votes_received,
      pa.votes_possible,
      CASE 
        WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
        ELSE NULL
      END as vote_percentage
    FROM fact_player_award pa
    JOIN dim_season s ON s.season_id = pa.season_id
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = pa.player_id 
      AND ps.season_id = pa.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.award_name = 'MVP'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  ) as Array<Record<string, string | number | null>>;
}

/**
 * Defensive Player of the Year winner for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns DPOY winner record or undefined
 */
export function getDPOYWinner(
  seasonId: string
): Record<string, string | number | null> | undefined {
  return getCachedQueryOne(
    `SELECT 
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name,
      pa.votes_received,
      pa.votes_possible,
      CASE 
        WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
        ELSE NULL
      END as vote_percentage
    FROM fact_player_award pa
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = pa.player_id 
      AND ps.season_id = pa.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.season_id = ?
      AND pa.award_name = 'DPOY'
    ORDER BY pa.votes_received DESC
    LIMIT 1`,
    [seasonId],
    60_000
  ) as Record<string, string | number | null> | undefined;
}

/**
 * Get all DPOY winners in history.
 *
 * @returns Array of DPOY winner records ordered by season (newest first)
 */
export function getDPOYHistory(): Array<Record<string, string | number | null>> {
  return getCachedQueryMany(
    `SELECT 
      pa.season_id,
      s.start_year,
      s.end_year,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name,
      pa.votes_received,
      pa.votes_possible,
      CASE 
        WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
        ELSE NULL
      END as vote_percentage
    FROM fact_player_award pa
    JOIN dim_season s ON s.season_id = pa.season_id
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = pa.player_id 
      AND ps.season_id = pa.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.award_name = 'DPOY'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  ) as Array<Record<string, string | number | null>>;
}

/**
 * Rookie of the Year winner for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns ROY winner record or undefined
 */
export function getROYWinner(
  seasonId: string
): Record<string, string | number | null> | undefined {
  return getCachedQueryOne(
    `SELECT 
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name,
      pa.votes_received,
      pa.votes_possible,
      CASE 
        WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
        ELSE NULL
      END as vote_percentage
    FROM fact_player_award pa
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = pa.player_id 
      AND ps.season_id = pa.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.season_id = ?
      AND pa.award_name = 'ROY'
    ORDER BY pa.votes_received DESC
    LIMIT 1`,
    [seasonId],
    60_000
  ) as Record<string, string | number | null> | undefined;
}

/**
 * Get all ROY winners in history.
 *
 * @returns Array of ROY winner records ordered by season (newest first)
 */
export function getROYHistory(): Array<Record<string, string | number | null>> {
  return getCachedQueryMany(
    `SELECT 
      pa.season_id,
      s.start_year,
      s.end_year,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name,
      pa.votes_received,
      pa.votes_possible,
      CASE 
        WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
        ELSE NULL
      END as vote_percentage
    FROM fact_player_award pa
    JOIN dim_season s ON s.season_id = pa.season_id
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = pa.player_id 
      AND ps.season_id = pa.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.award_name = 'ROY'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  ) as Array<Record<string, string | number | null>>;
}

/**
 * Get All-NBA teams for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Object with first, second, and third teams
 */
export function getAllNBATeams(seasonId: string): {
  first: Array<Record<string, string | number | null>>;
  second: Array<Record<string, string | number | null>>;
  third: Array<Record<string, string | number | null>>;
} {
  const allTeams = getCachedQueryMany(
    `SELECT 
      an.team_number,
      an.position,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name
    FROM fact_all_nba an
    JOIN dim_player p ON p.bref_id = an.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = an.player_id 
      AND ps.season_id = an.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.season_id = ?
      AND an.team_type = 'All-NBA'
    ORDER BY an.team_number, an.position`,
    [seasonId],
    60_000
  ) as Array<Record<string, string | number | null>>;

  return {
    first: allTeams.filter(t => t['team_number'] === 1),
    second: allTeams.filter(t => t['team_number'] === 2),
    third: allTeams.filter(t => t['team_number'] === 3),
  };
}

/**
 * Get All-NBA teams history (all seasons).
 *
 * @returns Array of All-NBA selections ordered by season (newest first)
 */
export function getAllNBAHistory(): Array<Record<string, string | number | null>> {
  return getCachedQueryMany(
    `SELECT 
      an.season_id,
      s.start_year,
      s.end_year,
      an.team_number,
      CASE 
        WHEN an.team_number = 1 THEN 'First Team'
        WHEN an.team_number = 2 THEN 'Second Team'
        WHEN an.team_number = 3 THEN 'Third Team'
      END as team_name,
      an.position,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev
    FROM fact_all_nba an
    JOIN dim_season s ON s.season_id = an.season_id
    JOIN dim_player p ON p.bref_id = an.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = an.player_id 
      AND ps.season_id = an.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.team_type = 'All-NBA'
    ORDER BY s.start_year DESC, an.team_number, an.position`,
    [],
    60_000
  ) as Array<Record<string, string | number | null>>;
}

/**
 * Get All-Defensive teams for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Object with first and second teams
 */
export function getAllDefensiveTeams(seasonId: string): {
  first: Array<Record<string, string | number | null>>;
  second: Array<Record<string, string | number | null>>;
} {
  const allTeams = getCachedQueryMany(
    `SELECT 
      an.team_number,
      an.position,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name
    FROM fact_all_nba an
    JOIN dim_player p ON p.bref_id = an.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = an.player_id 
      AND ps.season_id = an.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.season_id = ?
      AND an.team_type = 'All-Defense'
    ORDER BY an.team_number, an.position`,
    [seasonId],
    60_000
  ) as Array<Record<string, string | number | null>>;

  return {
    first: allTeams.filter(t => t['team_number'] === 1),
    second: allTeams.filter(t => t['team_number'] === 2),
  };
}

/**
 * Get All-Defensive teams history.
 *
 * @returns Array of All-Defensive selections ordered by season (newest first)
 */
export function getAllDefensiveHistory(): Array<Record<string, string | number | null>> {
  return getCachedQueryMany(
    `SELECT 
      an.season_id,
      s.start_year,
      s.end_year,
      an.team_number,
      CASE 
        WHEN an.team_number = 1 THEN 'First Team'
        WHEN an.team_number = 2 THEN 'Second Team'
      END as team_name,
      an.position,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev
    FROM fact_all_nba an
    JOIN dim_season s ON s.season_id = an.season_id
    JOIN dim_player p ON p.bref_id = an.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = an.player_id 
      AND ps.season_id = an.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.team_type = 'All-Defense'
    ORDER BY s.start_year DESC, an.team_number, an.position`,
    [],
    60_000
  ) as Array<Record<string, string | number | null>>;
}

/**
 * Get complete award summary for a season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Object with MVP, DPOY, ROY winners and All-NBA teams
 */
export function getSeasonAwards(seasonId: string): {
  mvp: Record<string, string | number | null> | undefined;
  dpoy: Record<string, string | number | null> | undefined;
  roy: Record<string, string | number | null> | undefined;
  allNBA: {
    first: Array<Record<string, string | number | null>>;
    second: Array<Record<string, string | number | null>>;
    third: Array<Record<string, string | number | null>>;
  };
  allDefense: {
    first: Array<Record<string, string | number | null>>;
    second: Array<Record<string, string | number | null>>;
  };
} {
  return {
    mvp: getMVPWinner(seasonId),
    dpoy: getDPOYWinner(seasonId),
    roy: getROYWinner(seasonId),
    allNBA: getAllNBATeams(seasonId),
    allDefense: getAllDefensiveTeams(seasonId),
  };
}

/**
 * Get all available award types in the database.
 *
 * @returns Array of unique award names
 */
export function getAwardTypes(): Array<string> {
  const results = getCachedQueryMany(
    `SELECT DISTINCT award_name 
    FROM fact_player_award 
    WHERE award_type = 'individual'
    ORDER BY award_name`,
    [],
    300_000
  ) as Array<{ award_name: string }>;

  return results.map(r => r['award_name']);
}

/**
 * Get all award winners for a specific award type.
 *
 * @param awardName - Award name (e.g., "MVP", "DPOY", "ROY")
 * @returns Array of winner records ordered by season (newest first)
 */
export function getAwardWinners(
  awardName: string
): Array<Record<string, string | number | null>> {
  return getCachedQueryMany(
    `SELECT 
      pa.season_id,
      s.start_year,
      s.end_year,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name,
      pa.votes_received,
      pa.votes_possible,
      pa.trophy_name,
      CASE 
        WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
        ELSE NULL
      END as vote_percentage
    FROM fact_player_award pa
    JOIN dim_season s ON s.season_id = pa.season_id
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = pa.player_id 
      AND ps.season_id = pa.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.award_name = ?
    ORDER BY s.start_year DESC`,
    [awardName],
    60_000
  ) as Array<Record<string, string | number | null>>;
}
