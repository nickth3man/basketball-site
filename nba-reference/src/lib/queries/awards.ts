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

export interface AwardVotingRow {
  season_id: string;
  rank: number;
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
  team_name: string | null;
  votes_received: number | null;
  votes_possible: number | null;
  vote_percentage: number | null;
  first_place_votes: number | null;
  second_place_votes: number | null;
  third_place_votes: number | null;
}

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
    FROM (
      SELECT DISTINCT ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.season_id = ?
        AND ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ?
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
      AND t_ps.season_id = pa.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE pa.award_name = 'MVP'
    ORDER BY pa.votes_received DESC
    LIMIT 1`,
    [seasonId, seasonId],
    60_000
  );
}

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
    FROM (
      SELECT DISTINCT ps.season_id, ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ps_dedup.season_id
    JOIN dim_season s ON s.season_id = pa.season_id
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
      AND t_ps.season_id = pa.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE pa.award_name = 'MVP'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  );
}

export function getMVPVotingBySeason(seasonId: string): AwardVotingRow[] {
  return getCachedQueryMany<AwardVotingRow[]>(
    `SELECT 
      pa.season_id,
      RANK() OVER (ORDER BY pa.votes_received DESC) as rank,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name,
      pa.votes_received,
      pa.votes_possible,
      CASE 
        WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
        ELSE NULL
      END as vote_percentage,
      pa.first_place_votes,
      pa.second_place_votes,
      pa.third_place_votes
    FROM (
      SELECT DISTINCT ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.season_id = ?
        AND ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ?
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
      AND t_ps.season_id = pa.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE pa.award_name = 'MVP'
    ORDER BY pa.votes_received DESC`,
    [seasonId, seasonId],
    60_000
  );
}

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
    FROM (
      SELECT DISTINCT ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.season_id = ?
        AND ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ?
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
      AND t_ps.season_id = pa.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE pa.award_name = 'DPOY'
    ORDER BY pa.votes_received DESC
    LIMIT 1`,
    [seasonId, seasonId],
    60_000
  );
}

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
    FROM (
      SELECT DISTINCT ps.season_id, ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ps_dedup.season_id
    JOIN dim_season s ON s.season_id = pa.season_id
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
      AND t_ps.season_id = pa.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE pa.award_name = 'DPOY'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  );
}

export function getDPOYVotingBySeason(seasonId: string): AwardVotingRow[] {
  return getCachedQueryMany<AwardVotingRow[]>(
    `SELECT 
      pa.season_id,
      RANK() OVER (ORDER BY pa.votes_received DESC) as rank,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name,
      pa.votes_received,
      pa.votes_possible,
      CASE 
        WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
        ELSE NULL
      END as vote_percentage,
      pa.first_place_votes,
      pa.second_place_votes,
      pa.third_place_votes
    FROM (
      SELECT DISTINCT ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.season_id = ?
        AND ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ?
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
      AND t_ps.season_id = pa.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE pa.award_name = 'DPOY'
    ORDER BY pa.votes_received DESC`,
    [seasonId, seasonId],
    60_000
  );
}

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
    FROM (
      SELECT DISTINCT ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.season_id = ?
        AND ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ?
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
      AND t_ps.season_id = pa.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE pa.award_name = 'ROY'
    ORDER BY pa.votes_received DESC
    LIMIT 1`,
    [seasonId, seasonId],
    60_000
  );
}

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
    FROM (
      SELECT DISTINCT ps.season_id, ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ps_dedup.season_id
    JOIN dim_season s ON s.season_id = pa.season_id
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
      AND t_ps.season_id = pa.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE pa.award_name = 'ROY'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  );
}

export function getROYVotingBySeason(seasonId: string): AwardVotingRow[] {
  return getCachedQueryMany<AwardVotingRow[]>(
    `SELECT 
      pa.season_id,
      RANK() OVER (ORDER BY pa.votes_received DESC) as rank,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      t.full_name as team_name,
      pa.votes_received,
      pa.votes_possible,
      CASE 
        WHEN pa.votes_possible > 0 THEN ROUND(pa.votes_received * 100.0 / pa.votes_possible, 1)
        ELSE NULL
      END as vote_percentage,
      pa.first_place_votes,
      pa.second_place_votes,
      pa.third_place_votes
    FROM (
      SELECT DISTINCT ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.season_id = ?
        AND ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ?
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
      AND t_ps.season_id = pa.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE pa.award_name = 'ROY'
    ORDER BY pa.votes_received DESC`,
    [seasonId, seasonId],
    60_000
  );
}

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
    FROM (
      SELECT DISTINCT ps.season_id, ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.season_id = ?
        AND ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_all_nba an ON an.player_id = ps_dedup.bref_player_id AND an.season_id = ps_dedup.season_id
    JOIN dim_player p ON p.bref_id = an.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = an.player_id
      AND t_ps.season_id = an.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE an.season_id = ?
      AND an.team_type = 'All-NBA'
    ORDER BY an.team_number, an.position`,
    [seasonId, seasonId],
    60_000
  );

  return {
    first: allTeams.filter(team => team.team_number === 1),
    second: allTeams.filter(team => team.team_number === 2),
    third: allTeams.filter(team => team.team_number === 3),
  };
}

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
    FROM (
      SELECT DISTINCT ps.season_id, ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_all_nba an ON an.player_id = ps_dedup.bref_player_id AND an.season_id = ps_dedup.season_id
    JOIN dim_season s ON s.season_id = an.season_id
    JOIN dim_player p ON p.bref_id = an.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = an.player_id
      AND t_ps.season_id = an.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE an.team_type = 'All-NBA'
    ORDER BY s.start_year DESC, an.team_number, an.position`,
    [],
    60_000
  );
}

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
    FROM (
      SELECT DISTINCT ps.season_id, ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.season_id = ?
        AND ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_all_nba an ON an.player_id = ps_dedup.bref_player_id AND an.season_id = ps_dedup.season_id
    JOIN dim_player p ON p.bref_id = an.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = an.player_id
      AND t_ps.season_id = an.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE an.season_id = ?
      AND an.team_type = 'All-Defense'
    ORDER BY an.team_number, an.position`,
    [seasonId, seasonId],
    60_000
  );

  return {
    first: allTeams.filter(team => team.team_number === 1),
    second: allTeams.filter(team => team.team_number === 2),
  };
}

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
    FROM (
      SELECT DISTINCT ps.season_id, ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_all_nba an ON an.player_id = ps_dedup.bref_player_id AND an.season_id = ps_dedup.season_id
    JOIN dim_season s ON s.season_id = an.season_id
    JOIN dim_player p ON p.bref_id = an.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = an.player_id
      AND t_ps.season_id = an.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE an.team_type = 'All-Defense'
    ORDER BY s.start_year DESC, an.team_number, an.position`,
    [],
    60_000
  );
}

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
    FROM (
      SELECT DISTINCT ps.season_id, ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    JOIN fact_player_award pa ON pa.player_id = ps_dedup.bref_player_id AND pa.season_id = ps_dedup.season_id
    JOIN dim_season s ON s.season_id = pa.season_id
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = pa.player_id
      AND t_ps.season_id = pa.season_id
      AND t_ps.team_abbrev NOT LIKE '%TM'
      AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
    WHERE pa.award_name = ?
    ORDER BY s.start_year DESC`,
    [awardName],
    60_000
  );
}

/**
 * Get All-Rookie teams for a specific season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Object with first and second All-Rookie teams
 */
export function getAllRookieTeams(seasonId: string): {
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
    JOIN dim_player p ON p.player_id = an.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = p.bref_id
      AND ps.season_id = an.season_id
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.season_id = ?
      AND an.team_type = 'All-Rookie'
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
 * Get All-Rookie team history (all seasons).
 *
 * @returns Array of All-Rookie selections ordered by season (newest first)
 */
export function getAllRookieHistory(): AllTeamHistoryRow[] {
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
    JOIN dim_player p ON p.player_id = an.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = p.bref_id
      AND ps.season_id = an.season_id
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE an.team_type = 'All-Rookie'
    ORDER BY s.start_year DESC, an.team_number, an.position`,
    [],
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
      FROM (
        SELECT DISTINCT ps.season_id, ps.bref_player_id
        FROM fact_player_season_stats ps
        WHERE ps.season_id = ?
          AND ps.team_abbrev NOT LIKE '%TM'
          AND (ps.lg = 'NBA' OR ps.lg IS NULL)
      ) ps_dedup
      JOIN fact_all_nba_vote anv ON anv.player_id = ps_dedup.bref_player_id AND anv.season_id = ps_dedup.season_id
      JOIN dim_player p ON p.bref_id = anv.player_id
      LEFT JOIN fact_player_season_stats t_ps ON t_ps.bref_player_id = anv.player_id
        AND t_ps.season_id = anv.season_id
        AND t_ps.team_abbrev NOT LIKE '%TM'
        AND (t_ps.lg = 'NBA' OR t_ps.lg IS NULL)
      LEFT JOIN dim_team t ON t.bref_abbrev = t_ps.team_abbrev
      WHERE anv.season_id = ?
      ORDER BY anv.pts_won DESC, anv.team_number ASC, p.full_name ASC`,
    [seasonId, seasonId],
    60_000
  );
}
