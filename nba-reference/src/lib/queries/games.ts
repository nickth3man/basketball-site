/**
 * @fileoverview Game data queries - retrieves box scores, play-by-play, and game details.
 * 
 * This module provides query functions for game data:
 * - Basic game information (date, teams, scores, status)
 * - Player box scores (traditional stats)
 * - Advanced player box scores (eFG%, TS%, Game Score)
 * - Team box scores and Four Factors
 * - Play-by-play event streams
 * - Line score by period
 * 
 * All queries use the cached database layer (30s TTL) for performance.
 * 
 * @module @/lib/queries/games
 */

import { getDb } from "@/lib/db";

/**
 * Retrieves basic game information by ID.
 * 
 * Joins with dim_team to get team names and abbreviations for both
 * home and away teams.
 * 
 * @param gameId - Game ID (e.g., "0022400001")
 * @returns Game record or undefined if not found
 */
export function getGameById(gameId: string) {
  return getDb()
    .prepare(
      `SELECT g.game_id, g.game_date, g.season_type, g.status,
              g.home_score, g.away_score,
              ht.abbreviation as home_abbrev, ht.full_name as home_name,
              at.abbreviation as away_abbrev, at.full_name as away_name
       FROM fact_game g
       JOIN dim_team ht ON ht.team_id = g.home_team_id
       JOIN dim_team at ON at.team_id = g.away_team_id
       WHERE g.game_id = ?`,
    )
    .get(gameId) as Record<string, string | number | null> | undefined;
}

/**
 * Retrieves play-by-play events for a game.
 * 
 * Returns the most significant events (those with descriptions) from
 * the end of the game (newest first). Useful for game summaries.
 * 
 * @param gameId - Game ID
 * @param limit - Maximum number of events to return (default: 40)
 * @returns Array of play-by-play records
 */
export function getGamePbpEvents(gameId: string, limit = 40) {
  return getDb()
    .prepare(
      `SELECT period, pc_time_string, home_description, visitor_description, score
       FROM fact_play_by_play
       WHERE game_id = ?
         AND (home_description IS NOT NULL OR visitor_description IS NOT NULL)
       ORDER BY period DESC, pc_time_string DESC
       LIMIT ?`,
    )
    .all(gameId, limit) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieves traditional player box score statistics.
 * 
 * Returns all player stats for both teams, sorted by:
 * 1. Team (alphabetical)
 * 2. Starter status (starters first)
 * 3. Minutes played (descending)
 * 
 * @param gameId - Game ID
 * @returns Array of player box score records
 */
export function getGamePlayerBox(gameId: string) {
  return getDb()
    .prepare(
      `SELECT t.abbreviation as team,
              p.bref_id,
              p.full_name,
              pgl.starter,
              pgl.minutes_played,
              pgl.fgm,
              pgl.fga,
              pgl.fg3m,
              pgl.fg3a,
              pgl.ftm,
              pgl.fta,
              pgl.oreb,
              pgl.dreb,
              pgl.reb,
              pgl.ast,
              pgl.stl,
              pgl.blk,
              pgl.tov,
              pgl.pf,
              pgl.pts,
              pgl.plus_minus
       FROM player_game_log pgl
       JOIN dim_player p ON p.player_id = pgl.player_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       WHERE pgl.game_id = ?
       ORDER BY t.abbreviation ASC, pgl.starter DESC, pgl.minutes_played DESC`,
    )
    .all(gameId) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieves advanced player box score statistics.
 * 
 * Calculates advanced metrics from raw box score data:
 * - eFG%: Effective FG% = (FG + 0.5*3P) / FGA
 * - TS%: True Shooting% = PTS / (2 * (FGA + 0.44*FTA))
 * - TOV%: Turnover Rate = 100 * TOV / (FGA + 0.44*FTA + TOV)
 * - Game Score: Single-game productivity metric
 * 
 * Sorted by team then Game Score (highest first).
 * 
 * @param gameId - Game ID
 * @returns Array of advanced player box score records
 */
export function getGamePlayerAdvancedBox(gameId: string) {
  return getDb()
    .prepare(
      `SELECT t.abbreviation as team,
              p.bref_id,
              p.full_name,
              pgl.minutes_played,
              -- Effective Field Goal%
              CASE WHEN pgl.fga > 0 THEN ROUND(1.0 * (pgl.fgm + 0.5 * pgl.fg3m) / pgl.fga, 3) END AS efg_pct,
              -- True Shooting%
              CASE WHEN (pgl.fga + 0.44 * pgl.fta) > 0 THEN ROUND(1.0 * pgl.pts / (2 * (pgl.fga + 0.44 * pgl.fta)), 3) END AS ts_pct,
              -- Turnover Rate (possessions ending in TO)
              CASE WHEN (pgl.fga + 0.44 * pgl.fta + pgl.tov) > 0 THEN ROUND(100.0 * pgl.tov / (pgl.fga + 0.44 * pgl.fta + pgl.tov), 1) END AS tov_pct,
              -- Game Score (Hollinger single-game metric)
              ROUND(
                pgl.pts +
                0.4 * pgl.fgm -
                0.7 * pgl.fga -
                0.4 * (pgl.fta - pgl.ftm) +
                0.7 * pgl.oreb +
                0.3 * pgl.dreb +
                pgl.stl +
                0.7 * pgl.ast +
                0.7 * pgl.blk -
                0.4 * pgl.pf -
                pgl.tov,
                1
              ) AS game_score
       FROM player_game_log pgl
       JOIN dim_player p ON p.player_id = pgl.player_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       WHERE pgl.game_id = ?
       ORDER BY t.abbreviation ASC, game_score DESC`,
    )
    .all(gameId) as Array<Record<string, string | number | null>>;
}

/**
 * Calculates Four Factors for both teams in a game.
 * 
 * The Four Factors explain team success through:
 * - eFG%: Shooting efficiency
 * - TOV%: Ball security (lower is better)
 * - ORB%: Offensive rebounding (extending possessions)
 * - FT/FGA: Free throw generation
 * 
 * Note: This function performs calculations in JavaScript rather than SQL
 * to handle division-by-zero edge cases cleanly.
 * 
 * @param gameId - Game ID
 * @returns Array of Four Factors records (one per team)
 */
export function getGameTeamFourFactors(gameId: string) {
  const rows = getDb()
    .prepare(
      `SELECT t.abbreviation as team,
              tgl.fgm,
              tgl.fga,
              tgl.fg3m,
              tgl.ftm,
              tgl.fta,
              tgl.oreb,
              tgl.dreb,
              tgl.tov,
              opp.oreb as opp_oreb,
              opp.dreb as opp_dreb
       FROM team_game_log tgl
       JOIN dim_team t ON t.team_id = tgl.team_id
       -- Self-join to get opponent's rebounding stats for ORB%/DRB%
       JOIN team_game_log opp ON opp.game_id = tgl.game_id AND opp.team_id <> tgl.team_id
       WHERE tgl.game_id = ?
       ORDER BY t.abbreviation ASC`,
    )
    .all(gameId) as Array<Record<string, number | string | null>>;

  return rows.map((r) => {
    const fgm = Number(r.fgm ?? 0);
    const fga = Number(r.fga ?? 0);
    const fg3m = Number(r.fg3m ?? 0);
    const ftm = Number(r.ftm ?? 0);
    const fta = Number(r.fta ?? 0);
    const oreb = Number(r.oreb ?? 0);
    const dreb = Number(r.dreb ?? 0);
    const tov = Number(r.tov ?? 0);
    const oppOreb = Number(r.opp_oreb ?? 0);
    const oppDreb = Number(r.opp_dreb ?? 0);
    
    // Estimated possessions for TOV% calculation
    const possessions = fga + 0.44 * fta + tov;

    return {
      team: r.team,
      // eFG%: Accounts for 3P being worth 1.5x a 2P
      efg_pct: fga > 0 ? Number(((fgm + 0.5 * fg3m) / fga).toFixed(3)) : null,
      // TOV%: Percentage of possessions ending in turnover
      tov_pct:
        possessions > 0 ? Number(((100 * tov) / possessions).toFixed(1)) : null,
      // ORB%: Percentage of available offensive rebounds grabbed
      orb_pct:
        oreb + oppDreb > 0
          ? Number(((100 * oreb) / (oreb + oppDreb)).toFixed(1))
          : null,
      // FT/FGA: Free throws made per field goal attempt
      ft_fga: fga > 0 ? Number((ftm / fga).toFixed(3)) : null,
      // DRB%: Percentage of available defensive rebounds grabbed
      drb_pct:
        dreb + oppOreb > 0
          ? Number(((100 * dreb) / (dreb + oppOreb)).toFixed(1))
          : null,
    };
  });
}

/**
 * Calculates the line score (points per period) for a game.
 * 
 * Processes play-by-play score strings to derive each team's
 * scoring by period. Handles edge cases where score format
 * may be inconsistent.
 * 
 * @param gameId - Game ID
 * @returns Array of period scoring records
 */
export function getGameLineScore(gameId: string) {
  const rows = getDb()
    .prepare(
      `SELECT period, score
       FROM fact_play_by_play
       WHERE game_id = ?
         AND score IS NOT NULL
       ORDER BY period ASC, event_id ASC`,
    )
    .all(gameId) as Array<{ period: number; score: string }>;

  const byPeriod = new Map<number, { away: number; home: number }>();
  let prevAway = 0;
  let prevHome = 0;

  for (const row of rows) {
    // Parse "away-home" score format (e.g., "45-52")
    const parts = row.score.split("-");
    if (parts.length !== 2) continue;
    const away = Number(parts[0]);
    const home = Number(parts[1]);
    if (Number.isNaN(away) || Number.isNaN(home)) continue;

    // Calculate points scored in this period by subtracting previous totals
    byPeriod.set(row.period, {
      away: away - prevAway,
      home: home - prevHome,
    });

    prevAway = away;
    prevHome = home;
  }

  return Array.from(byPeriod.entries())
    .map(([period, scores]) => ({ period, ...scores }))
    .sort((a, b) => a.period - b.period);
}

/**
 * Retrieves team-level box score statistics.
 * 
 * @param gameId - Game ID
 * @returns Array of team box score records (typically 2: home and away)
 */
export function getTeamGameBox(gameId: string) {
  return getDb()
    .prepare(
      `SELECT t.abbreviation as team, tgl.fgm, tgl.fga, tgl.fg3m, tgl.fg3a,
              tgl.ftm, tgl.fta, tgl.reb, tgl.ast, tgl.stl, tgl.blk, tgl.tov,
              tgl.pf, tgl.pts
       FROM team_game_log tgl
       JOIN dim_team t ON t.team_id = tgl.team_id
       WHERE tgl.game_id = ?
       ORDER BY t.abbreviation`,
    )
    .all(gameId) as Array<Record<string, string | number | null>>;
}
