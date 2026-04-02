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
import {
  AWARD_PLAYER_DEDUP,
  AWARD_PLAYER_JOIN,
  AWARD_PLAYER_JOIN_SINGLE_SEASON,
  AWARD_SELECT_COLUMNS,
  AWARD_SINGLE_SELECT_COLUMNS,
  AWARD_VOTING_SELECT_COLUMNS,
  type AllTeamHistoryRow,
  type AllTeamSelectionRow,
  type AwardHistoryRow,
  type AwardVotingRow,
  type AwardWinnerRow,
  type AwardWinnerWithTrophyRow,
} from './awards-shared';
export type {
  AllTeamHistoryRow,
  AllTeamSelectionRow,
  AwardHistoryRow,
  AwardVotingRow,
  AwardWinnerRow,
  AwardWinnerWithTrophyRow,
} from './awards-shared';
export { getAllNBAVotingBySeason, getAllRookieHistory, getAllRookieTeams } from './awards-rookie';

interface AwardTypeRow {
  award_name: string;
}

function getAwardHistory(awardName: string): AwardHistoryRow[] {
  return getCachedQueryMany<AwardHistoryRow[]>(
    `SELECT ${AWARD_SELECT_COLUMNS}
    FROM ${AWARD_PLAYER_DEDUP}
    ${AWARD_PLAYER_JOIN}
    WHERE pa.award_name = ?
    ORDER BY s.start_year DESC`,
    [awardName],
    60_000
  );
}

function getAwardVotingBySeason(awardName: string, seasonId: string): AwardVotingRow[] {
  return getCachedQueryMany<AwardVotingRow[]>(
    `SELECT ${AWARD_VOTING_SELECT_COLUMNS}
    FROM (
      SELECT DISTINCT ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.season_id = ?
        AND ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    ) ps_dedup
    ${AWARD_PLAYER_JOIN_SINGLE_SEASON}
    WHERE pa.award_name = ?
    ORDER BY pa.votes_received DESC`,
    [seasonId, seasonId, awardName],
    60_000
  );
}

function getAwardWinner(awardName: string, seasonId: string): AwardWinnerRow | undefined {
  return getCachedQueryOne<AwardWinnerRow | undefined>(
    `SELECT ${AWARD_SINGLE_SELECT_COLUMNS}
    FROM (
      SELECT DISTINCT ps.bref_player_id
      FROM fact_player_season_stats ps
      WHERE ps.season_id = ?
        AND ps.team_abbrev NOT LIKE '%TM'
        AND (ps.lg = 'NBA' OR t_ps.lg IS NULL)
    ) ps_dedup
    ${AWARD_PLAYER_JOIN_SINGLE_SEASON}
    WHERE pa.award_name = ?
    ORDER BY pa.votes_received DESC
    LIMIT 1`,
    [seasonId, seasonId, awardName],
    60_000
  );
}

// ---------------------------------------------------------------------------
// Public API — MVP
// ---------------------------------------------------------------------------

export function getMVPWinner(seasonId: string): AwardWinnerRow | undefined {
  return getAwardWinner('MVP', seasonId);
}

export function getMVPHistory(): AwardHistoryRow[] {
  return getAwardHistory('MVP');
}

export function getMVPVotingBySeason(seasonId: string): AwardVotingRow[] {
  return getAwardVotingBySeason('MVP', seasonId);
}

// ---------------------------------------------------------------------------
// Public API — DPOY
// ---------------------------------------------------------------------------

export function getDPOYWinner(seasonId: string): AwardWinnerRow | undefined {
  return getAwardWinner('DPOY', seasonId);
}

export function getDPOYHistory(): AwardHistoryRow[] {
  return getAwardHistory('DPOY');
}

export function getDPOYVotingBySeason(seasonId: string): AwardVotingRow[] {
  return getAwardVotingBySeason('DPOY', seasonId);
}

// ---------------------------------------------------------------------------
// Public API — ROY
// ---------------------------------------------------------------------------

export function getROYWinner(seasonId: string): AwardWinnerRow | undefined {
  return getAwardWinner('ROY', seasonId);
}

export function getROYHistory(): AwardHistoryRow[] {
  return getAwardHistory('ROY');
}

export function getROYVotingBySeason(seasonId: string): AwardVotingRow[] {
  return getAwardVotingBySeason('ROY', seasonId);
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
