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

export interface AwardWinnerRow {
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
  team_name: string | null;
  votes_received: number | null;
  votes_possible: number | null;
  vote_percentage: number | null;
}

export interface AwardHistoryRow extends AwardWinnerRow {
  season_id: string;
  start_year: number;
  end_year: number;
}

export interface AllTeamSelectionRow {
  team_number: number;
  position: string;
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
  team_name: string | null;
}

export interface AllTeamHistoryRow {
  season_id: string;
  start_year: number;
  end_year: number;
  team_number: number;
  team_name: string;
  position: string;
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
}

interface AwardTypeRow {
  award_name: string;
}

export interface AwardWinnerWithTrophyRow extends AwardHistoryRow {
  trophy_name: string | null;
}

/**
 * MVP winner for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns MVP winner record or undefined
 */
export function getMVPWinner(seasonId: string): AwardWinnerRow | undefined {
  return getCachedQueryOne<AwardWinnerRow | undefined>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.season_id = ?
      AND pa.award_name = 'MVP'
    ORDER BY pa.votes_received DESC
    LIMIT 1`,
    [seasonId],
    60_000
  );
}

/**
 * Get all MVP winners in history.
 *
 * @returns Array of MVP winner records ordered by season (newest first)
 */
export function getMVPHistory(): AwardHistoryRow[] {
  return getCachedQueryMany<AwardHistoryRow[]>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.award_name = 'MVP'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  );
}

/**
 * Defensive Player of the Year winner for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns DPOY winner record or undefined
 */
export function getDPOYWinner(seasonId: string): AwardWinnerRow | undefined {
  return getCachedQueryOne<AwardWinnerRow | undefined>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
     WHERE pa.season_id = ?
       AND pa.award_name = 'DPOY'
    ORDER BY pa.votes_received DESC
    LIMIT 1`,
    [seasonId],
    60_000
  );
}

/**
 * Get all DPOY winners in history.
 *
 * @returns Array of DPOY winner records ordered by season (newest first)
 */
export function getDPOYHistory(): AwardHistoryRow[] {
  return getCachedQueryMany<AwardHistoryRow[]>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.award_name = 'DPOY'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  );
}

/**
 * Rookie of the Year winner for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns ROY winner record or undefined
 */
export function getROYWinner(seasonId: string): AwardWinnerRow | undefined {
  return getCachedQueryOne<AwardWinnerRow | undefined>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
     WHERE pa.season_id = ?
       AND pa.award_name = 'ROY'
    ORDER BY pa.votes_received DESC
    LIMIT 1`,
    [seasonId],
    60_000
  );
}

/**
 * Get all ROY winners in history.
 *
 * @returns Array of ROY winner records ordered by season (newest first)
 */
export function getROYHistory(): AwardHistoryRow[] {
  return getCachedQueryMany<AwardHistoryRow[]>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.award_name = 'ROY'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  );
}

/**
 * Get All-NBA teams for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Object with first, second, and third teams
 */
export function getAllNBATeams(seasonId: string): {
  first: AllTeamSelectionRow[];
  second: AllTeamSelectionRow[];
  third: AllTeamSelectionRow[];
} {
  const allTeams = getCachedQueryMany<AllTeamSelectionRow[]>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.season_id = ?
      AND an.team_type = 'All-NBA'
    ORDER BY an.team_number, an.position`,
    [seasonId],
    60_000
  );

  return {
    first: allTeams.filter(team => team.team_number === 1),
    second: allTeams.filter(team => team.team_number === 2),
    third: allTeams.filter(team => team.team_number === 3),
  };
}

/**
 * Get All-NBA teams history (all seasons).
 *
 * @returns Array of All-NBA selections ordered by season (newest first)
 */
export function getAllNBAHistory(): AllTeamHistoryRow[] {
  return getCachedQueryMany<AllTeamHistoryRow[]>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.team_type = 'All-NBA'
    ORDER BY s.start_year DESC, an.team_number, an.position`,
    [],
    60_000
  );
}

/**
 * Get All-Defensive teams for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Object with first and second teams
 */
export function getAllDefensiveTeams(seasonId: string): {
  first: AllTeamSelectionRow[];
  second: AllTeamSelectionRow[];
} {
  const allTeams = getCachedQueryMany<AllTeamSelectionRow[]>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.season_id = ?
      AND an.team_type = 'All-Defense'
    ORDER BY an.team_number, an.position`,
    [seasonId],
    60_000
  );

  return {
    first: allTeams.filter(team => team.team_number === 1),
    second: allTeams.filter(team => team.team_number === 2),
  };
}

/**
 * Get All-Defensive teams history.
 *
 * @returns Array of All-Defensive selections ordered by season (newest first)
 */
export function getAllDefensiveHistory(): AllTeamHistoryRow[] {
  return getCachedQueryMany<AllTeamHistoryRow[]>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.team_type = 'All-Defense'
    ORDER BY s.start_year DESC, an.team_number, an.position`,
    [],
    60_000
  );
}

/**
 * Get complete award summary for a season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Object with MVP, DPOY, ROY winners and All-NBA teams
 */
export function getSeasonAwards(seasonId: string): {
  mvp: AwardWinnerRow | undefined;
  dpoy: AwardWinnerRow | undefined;
  roy: AwardWinnerRow | undefined;
  allNBA: {
    first: AllTeamSelectionRow[];
    second: AllTeamSelectionRow[];
    third: AllTeamSelectionRow[];
  };
  allDefense: {
    first: AllTeamSelectionRow[];
    second: AllTeamSelectionRow[];
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
export function getAwardTypes(): string[] {
  const results = getCachedQueryMany<AwardTypeRow[]>(
    `SELECT DISTINCT award_name 
    FROM fact_player_award 
    WHERE award_type = 'individual'
    ORDER BY award_name`,
    [],
    300_000
  );

  return results.map(result => result.award_name);
}

/**
 * Get all award winners for a specific award type.
 *
 * @param awardName - Award name (e.g., "MVP", "DPOY", "ROY")
 * @returns Array of winner records ordered by season (newest first)
 */
export function getAwardWinners(awardName: string): AwardWinnerWithTrophyRow[] {
  return getCachedQueryMany<AwardWinnerWithTrophyRow[]>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.award_name = ?
    ORDER BY s.start_year DESC`,
    [awardName],
    60_000
  );
}

export function getAllNBAVotingBySeason(
  seasonId: string
): Array<Record<string, string | number | null>> {
  return getCachedQueryMany<Array<Record<string, string | number | null>>>(
    `SELECT anv.season_id,
            anv.team_type,
            anv.team_number,
            anv.position,
            p.bref_id,
            p.full_name,
            t.bref_abbrev AS team_abbrev,
            anv.pts_won,
            anv.pts_max,
            anv.share,
            anv.first_team_votes,
            anv.second_team_votes,
            anv.third_team_votes
      FROM fact_all_nba_vote anv
      JOIN dim_player p ON p.bref_id = anv.player_id
      LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = anv.player_id
        AND ps.season_id = anv.season_id
        AND ps.lg = 'NBA'
      LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
      WHERE anv.season_id = ?
      ORDER BY anv.pts_won DESC, anv.team_number ASC, p.full_name ASC`,
    [seasonId],
    60_000
  );
}
