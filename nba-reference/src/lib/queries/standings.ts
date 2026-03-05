/**
 * @fileoverview Standings data queries - computes standings as of any date.
 *
 * This module provides query functions for standings data:
 * - Standings as of a specific date (computed from game results)
 * - Available game dates for a season
 * - Current season standings
 *
 * All queries use the cached database layer (30s TTL) for performance.
 *
 * @module @/lib/queries/standings
 */

import { getCachedQueryMany, getCachedQueryOne, getLatestSeasonId } from '@/lib/db';

/**
 * Represents a team standing row computed from game results.
 */
export interface TeamStandingRow {
  /** Team abbreviation */
  team_abbrev: string;
  /** Team full name */
  team_name: string;
  /** Conference (East/West) */
  conference: string | null;
  /** Wins */
  w: number;
  /** Losses */
  l: number;
  /** Win percentage */
  win_pct: number;
  /** Games behind conference leader */
  gb: number | null;
  /** Points scored per game */
  ps_g: number | null;
  /** Points allowed per game */
  pa_g: number | null;
}

/**
 * Compute team standings as of a specific date by aggregating game results.
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Array of team standing records ordered by win percentage (descending)
 */
export function getStandingsAsOfDate(date: string, seasonId: string): TeamStandingRow[] {
  const rawStandings = getCachedQueryMany<
    Array<{
      team_id: string;
      team_abbrev: string;
      team_name: string;
      conference: string | null;
      w: number;
      l: number;
      pf: number;
      pa: number;
      games: number;
    }>
  >(
    `WITH team_results AS (
      SELECT 
        g.home_team_id as team_id,
        CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END as wins,
        CASE WHEN g.home_score > g.away_score THEN 0 ELSE 1 END as losses,
        g.home_score as pts_for,
        g.away_score as pts_against
      FROM fact_game g
      WHERE g.game_date <= ?
        AND g.season_id = ?
        AND g.status = 'Final'
        AND g.home_score IS NOT NULL
        AND g.away_score IS NOT NULL
      UNION ALL
      SELECT 
        g.away_team_id as team_id,
        CASE WHEN g.away_score > g.home_score THEN 1 ELSE 0 END as wins,
        CASE WHEN g.away_score > g.home_score THEN 0 ELSE 1 END as losses,
        g.away_score as pts_for,
        g.home_score as pts_against
      FROM fact_game g
      WHERE g.game_date <= ?
        AND g.season_id = ?
        AND g.status = 'Final'
        AND g.home_score IS NOT NULL
        AND g.away_score IS NOT NULL
    )
    SELECT 
      tr.team_id,
      t.abbreviation as team_abbrev,
      t.full_name as team_name,
      t.conference,
      SUM(tr.wins) as w,
      SUM(tr.losses) as l,
      SUM(tr.pts_for) as pf,
      SUM(tr.pts_against) as pa,
      COUNT(*) as games
    FROM team_results tr
    JOIN dim_team t ON t.team_id = tr.team_id
    GROUP BY tr.team_id, t.abbreviation, t.full_name, t.conference
    ORDER BY t.conference, SUM(tr.wins) * 1.0 / NULLIF(COUNT(*), 0) DESC`,
    [date, seasonId, date, seasonId],
    60_000
  );

  // Calculate win percentage and games behind for each conference
  const eastTeams: TeamStandingRow[] = [];
  const westTeams: TeamStandingRow[] = [];

  for (const row of rawStandings) {
    const totalGames = row.w + row.l;
    const winPct = totalGames > 0 ? Math.round((row.w / totalGames) * 1000) / 1000 : 0;
    const psG = row.games > 0 ? Math.round((row.pf / row.games) * 10) / 10 : null;
    const paG = row.games > 0 ? Math.round((row.pa / row.games) * 10) / 10 : null;

    const standing: TeamStandingRow = {
      team_abbrev: row.team_abbrev,
      team_name: row.team_name,
      conference: row.conference,
      w: row.w,
      l: row.l,
      win_pct: winPct,
      gb: null, // Will be calculated below
      ps_g: psG,
      pa_g: paG,
    };

    if (row.conference === 'East') {
      eastTeams.push(standing);
    } else if (row.conference === 'West') {
      westTeams.push(standing);
    }
  }

  // Sort by win percentage and calculate games behind
  eastTeams.sort((a, b) => b.win_pct - a.win_pct);
  westTeams.sort((a, b) => b.win_pct - a.win_pct);

  // Calculate GB for each conference
  const calculateGB = (teams: TeamStandingRow[]): void => {
    if (teams.length === 0) return;
    const leader = teams[0];
    if (leader === undefined) return;
    
    for (const team of teams) {
      // GB = ((Leader Wins - Team Wins) + (Team Losses - Leader Losses)) / 2
      const gbValue = ((leader.w - team.w) + (team.l - leader.l)) / 2;
      team.gb = gbValue <= 0 ? 0 : Math.round(gbValue * 10) / 10;
    }
  };

  calculateGB(eastTeams);
  calculateGB(westTeams);

  // Return combined, sorted by conference then win percentage
  return [...eastTeams, ...westTeams];
}

/**
 * Get all game dates for a season (dates with at least one final game).
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Array of date strings (YYYY-MM-DD), ordered chronologically
 */
export function getAvailableDates(seasonId: string): string[] {
  const rows = getCachedQueryMany<Array<{ game_date: string }>>(
    `SELECT DISTINCT game_date
     FROM fact_game
     WHERE season_id = ?
       AND status = 'Final'
       AND home_score IS NOT NULL
       AND away_score IS NOT NULL
     ORDER BY game_date ASC`,
    [seasonId],
    60_000
  );

  return rows.map((row) => row.game_date);
}

/**
 * Get the most recent game date for a season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Most recent game date string (YYYY-MM-DD) or undefined
 */
export function getMostRecentGameDate(seasonId: string): string | undefined {
  const row = getCachedQueryOne<{ game_date: string } | undefined>(
    `SELECT MAX(game_date) as game_date
     FROM fact_game
     WHERE season_id = ?
       AND status = 'Final'
       AND home_score IS NOT NULL
       AND away_score IS NOT NULL`,
    [seasonId],
    60_000
  );

  return row?.game_date;
}

/**
 * Get current season standings (as of the most recent game date).
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Array of team standing records ordered by win percentage (descending)
 */
export function getCurrentStandings(seasonId: string): TeamStandingRow[] {
  const mostRecentDate = getMostRecentGameDate(seasonId);
  if (!mostRecentDate) {
    return [];
  }
  return getStandingsAsOfDate(mostRecentDate, seasonId);
}

/**
 * Get the season ID for the current/most recent NBA season.
 *
 * @returns The current season ID (e.g., "2024-25")
 */
export function getCurrentSeasonId(): string {
  return getLatestSeasonId();
}

/**
 * Get all seasons that have game data available.
 *
 * @returns Array of season records ordered by start year (newest first)
 */
export function getSeasonsWithGames(): Array<{ season_id: string; start_year: number; end_year: number }> {
  return getCachedQueryMany<
    Array<{ season_id: string; start_year: number; end_year: number }>
  >(
    `SELECT DISTINCT s.season_id, s.start_year, s.end_year
     FROM dim_season s
     JOIN fact_game g ON g.season_id = s.season_id
     WHERE g.status = 'Final'
       AND g.home_score IS NOT NULL
       AND g.away_score IS NOT NULL
     ORDER BY s.start_year DESC`,
    [],
    60_000
  );
}
