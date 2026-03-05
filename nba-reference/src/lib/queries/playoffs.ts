/**
 * @fileoverview Playoffs data queries - retrieves playoff brackets, series, and game information.
 *
 * This module provides query functions for playoff data:
 * - Playoff seasons list
 * - Playoff bracket/series for a season
 * - Series details and game results
 * - Playoff leaders (points, rebounds, assists, win shares)
 *
 * All queries use the cached database layer (30s TTL) for performance.
 *
 * @module @/lib/queries/playoffs
 */

import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';

/**
 * Get all seasons that have playoff data.
 *
 * @returns Array of season records with ID and year range, ordered by start year (newest first)
 */
export function getPlayoffSeasons(): Array<{ season_id: string; start_year: number; end_year: number }> {
  return getCachedQueryMany(
    `SELECT DISTINCT s.season_id, s.start_year, s.end_year
     FROM dim_season s
     JOIN fact_game g ON g.season_id = s.season_id
     WHERE g.season_type = 'Playoffs'
     ORDER BY s.start_year DESC`,
    [],
    60_000
  ) as Array<{ season_id: string; start_year: number; end_year: number }>;
}

/**
 * Retrieve all playoff series for a given season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Array of series records with team info, series results, and game count
 */
export function getPlayoffSeriesBySeason(
  seasonId: string
): Array<Record<string, string | number | null>> {
  return getCachedQueryMany(
    `WITH series_games AS (
      SELECT 
        g.game_id,
        g.game_date,
        g.home_team_id,
        g.away_team_id,
        g.home_score,
        g.away_score,
        CASE 
          WHEN g.home_score > g.away_score THEN g.home_team_id 
          ELSE g.away_team_id 
        END as winner_id,
        ht.bref_abbrev as home_abbrev,
        at.bref_abbrev as away_abbrev,
        ht.full_name as home_name,
        at.full_name as away_name,
        ROW_NUMBER() OVER (
          PARTITION BY 
            CASE WHEN g.home_team_id < g.away_team_id 
              THEN g.home_team_id || '-' || g.away_team_id 
              ELSE g.away_team_id || '-' || g.home_team_id 
            END
          ORDER BY g.game_date
        ) as game_num
      FROM fact_game g
      JOIN dim_team ht ON ht.team_id = g.home_team_id
      JOIN dim_team at ON at.team_id = g.away_team_id
      WHERE g.season_id = ?
        AND g.season_type = 'Playoffs'
        AND g.status = 'Final'
    ),
    series_summary AS (
      SELECT 
        home_abbrev,
        away_abbrev,
        home_name,
        away_name,
        COUNT(*) as total_games,
        SUM(CASE WHEN winner_id = home_team_id THEN 1 ELSE 0 END) as home_wins,
        SUM(CASE WHEN winner_id = away_team_id THEN 1 ELSE 0 END) as away_wins,
        MAX(CASE WHEN game_num = 1 THEN game_id END) as series_id
      FROM series_games
      GROUP BY home_abbrev, away_abbrev, home_name, away_name
    )
    SELECT 
      home_abbrev,
      away_abbrev,
      home_name,
      away_name,
      total_games,
      home_wins,
      away_wins,
      CASE 
        WHEN home_wins > away_wins THEN home_abbrev 
        ELSE away_abbrev 
      END as winner_abbrev,
      series_id
    FROM series_summary
    ORDER BY total_games DESC, home_abbrev`,
    [seasonId],
    60_000
  ) as Array<Record<string, string | number | null>>;
}

/**
 * Get detailed game results for a specific playoff series.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @param team1Abbrev - First team abbreviation
 * @param team2Abbrev - Second team abbreviation
 * @returns Array of game records for the series
 */
export function getPlayoffSeriesGames(
  seasonId: string,
  team1Abbrev: string,
  team2Abbrev: string
): Array<Record<string, string | number | null>> {
  return getCachedQueryMany(
    `SELECT 
      g.game_id,
      g.game_date,
      g.home_score,
      g.away_score,
      ht.bref_abbrev as home_abbrev,
      at.bref_abbrev as away_abbrev,
      ht.full_name as home_name,
      at.full_name as away_name,
      CASE 
        WHEN g.home_score > g.away_score THEN ht.bref_abbrev 
        ELSE at.bref_abbrev 
      END as winner_abbrev
    FROM fact_game g
    JOIN dim_team ht ON ht.team_id = g.home_team_id
    JOIN dim_team at ON at.team_id = g.away_team_id
    WHERE g.season_id = ?
      AND g.season_type = 'Playoffs'
      AND g.status = 'Final'
      AND (
        (ht.bref_abbrev = ? AND at.bref_abbrev = ?) OR
        (ht.bref_abbrev = ? AND at.bref_abbrev = ?)
      )
    ORDER BY g.game_date`,
    [seasonId, team1Abbrev, team2Abbrev, team2Abbrev, team1Abbrev],
    60_000
  ) as Array<Record<string, string | number | null>>;
}

/**
 * Get playoff leaders for a season (points, rebounds, assists, win shares).
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @param stat - Statistic to lead by: 'pts', 'reb', 'ast', 'ws'
 * @param limit - Maximum number of leaders to return (default: 10)
 * @returns Array of leader records
 */
export function getPlayoffLeaders(
  seasonId: string,
  stat: 'pts' | 'reb' | 'ast' | 'ws' = 'pts',
  limit = 10
): Array<Record<string, string | number | null>> {
  const statColumn = {
    pts: 'SUM(pgl.pts)',
    reb: 'SUM(pgl.reb)',
    ast: 'SUM(pgl.ast)',
    ws: '0', // Placeholder - win shares not in game logs
  }[stat];

  const statName = {
    pts: 'total_pts',
    reb: 'total_reb',
    ast: 'total_ast',
    ws: 'total_ws',
  }[stat];

  return getCachedQueryMany(
    `SELECT 
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      COUNT(DISTINCT pgl.game_id) as games,
      ROUND(${statColumn}, 1) as ${statName},
      ROUND(${statColumn} * 1.0 / COUNT(DISTINCT pgl.game_id), 1) as ${stat}_pg
    FROM player_game_log pgl
    JOIN dim_player p ON p.bref_id = pgl.player_id
    JOIN dim_team t ON t.team_id = pgl.team_id
    JOIN fact_game g ON g.game_id = pgl.game_id
    WHERE g.season_id = ?
      AND g.season_type = 'Playoffs'
    GROUP BY p.bref_id, p.full_name, t.bref_abbrev
    HAVING COUNT(DISTINCT pgl.game_id) >= 3
    ORDER BY ${statName} DESC
    LIMIT ?`,
    [seasonId, limit],
    60_000
  ) as Array<Record<string, string | number | null>>;
}

/**
 * Get the NBA Finals result for a season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Finals series record or undefined if not found
 */
export function getNBAFinals(
  seasonId: string
): Record<string, string | number | null> | undefined {
  return getCachedQueryOne(
    `WITH finals_games AS (
      SELECT 
        g.game_id,
        g.game_date,
        g.home_team_id,
        g.away_team_id,
        g.home_score,
        g.away_score,
        ht.bref_abbrev as home_abbrev,
        at.bref_abbrev as away_abbrev,
        ht.full_name as home_name,
        at.full_name as away_name,
        CASE 
          WHEN g.home_score > g.away_score THEN ht.bref_abbrev 
          ELSE at.bref_abbrev 
        END as winner_abbrev,
        ROW_NUMBER() OVER (ORDER BY g.game_date) as game_num
      FROM fact_game g
      JOIN dim_team ht ON ht.team_id = g.home_team_id
      JOIN dim_team at ON at.team_id = g.away_team_id
      WHERE g.season_id = ?
        AND g.season_type = 'Playoffs'
        AND g.status = 'Final'
    ),
    series_count AS (
      SELECT 
        home_abbrev,
        away_abbrev,
        home_name,
        away_name,
        COUNT(*) as total_games,
        SUM(CASE WHEN winner_id = home_team_id THEN 1 ELSE 0 END) as home_wins,
        SUM(CASE WHEN winner_id = away_team_id THEN 1 ELSE 0 END) as away_wins
      FROM finals_games
      GROUP BY home_abbrev, away_abbrev, home_name, away_name
    )
    SELECT *
    FROM series_count
    ORDER BY total_games DESC
    LIMIT 1`,
    [seasonId],
    60_000
  ) as Record<string, string | number | null> | undefined;
}

/**
 * Get the champion team for a season.
 *
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Team abbreviation of the champion, or undefined
 */
export function getSeasonChampion(seasonId: string): string | undefined {
  const finals = getNBAFinals(seasonId);
  if (!finals) return undefined;
  
  const homeWins = (finals['home_wins'] as number) || 0;
  const awayWins = (finals['away_wins'] as number) || 0;
  
  if (homeWins >= 4) {
    return finals['home_abbrev'] as string;
  } else if (awayWins >= 4) {
    return finals['away_abbrev'] as string;
  }
  
  return undefined;
}

/**
 * Get playoff series summary organized by round.
 * 
 * @param seasonId - Season identifier (e.g., "2024-25")
 * @returns Object with series organized by conference and round
 */
export function getPlayoffBracket(
  seasonId: string
): {
  east: Record<string, Array<Record<string, string | number | null>>>;
  west: Record<string, Array<Record<string, string | number | null>>>;
  finals: Record<string, string | number | null> | undefined;
} {
  const allSeries = getPlayoffSeriesBySeason(seasonId);
  
  // This is a simplified bracket - in reality, you'd need more data
  // to properly identify rounds. This assumes we can infer from game counts.
  const east: Record<string, Array<Record<string, string | number | null>>> = {
    'First Round': [],
    'Conference Semifinals': [],
    'Conference Finals': [],
  };
  const west: Record<string, Array<Record<string, string | number | null>>> = {
    'First Round': [],
    'Conference Semifinals': [],
    'Conference Finals': [],
  };
  
  // Infer conference from team abbreviations (simplified)
  // East teams: BOS, BRK, NYK, PHI, TOR, CHI, CLE, IND, DET, MIL, ATL, CHO, MIA, ORL, WAS
  const eastTeams = new Set(['BOS', 'BRK', 'NYK', 'PHI', 'TOR', 'CHI', 'CLE', 'IND', 'DET', 'MIL', 'ATL', 'CHO', 'MIA', 'ORL', 'WAS']);
  // West teams: DEN, MIN, OKC, POR, UTA, GSW, LAC, LAL, PHO, SAC, DAL, HOU, MEM, NOP, SAS
  const westTeams = new Set(['DEN', 'MIN', 'OKC', 'POR', 'UTA', 'GSW', 'LAC', 'LAL', 'PHO', 'SAC', 'DAL', 'HOU', 'MEM', 'NOP', 'SAS']);
  
  for (const series of allSeries) {
    const homeAbbrev = series['home_abbrev'] as string;
    const awayAbbrev = series['away_abbrev'] as string;
    const totalGames = (series['total_games'] as number) || 0;
    
    // Infer round from series position (simplified logic)
    // This would need refinement with actual seeding data
    let round = 'First Round';
    if (totalGames >= 4) {
      // Could be later rounds - need more logic
      round = 'Conference Semifinals';
    }
    
    // Assign to conference
    if (eastTeams.has(homeAbbrev) && eastTeams.has(awayAbbrev)) {
      const roundKey = round as keyof typeof east;
      east[roundKey] = [...(east[roundKey] || []), series];
    } else if (westTeams.has(homeAbbrev) && westTeams.has(awayAbbrev)) {
      const roundKey = round as keyof typeof west;
      west[roundKey] = [...(west[roundKey] || []), series];
    }
    // Cross-conference series would be finals
  }
  
  const finals = getNBAFinals(seasonId);
  
  return { east, west, finals };
}
