/**
 * @fileoverview Player game queries - recent games, full game logs, vs opponent stats.
 *
 * @module @/lib/queries/players/games
 */

import { getDb } from '@/lib/db';

/**
 * Retrieves a player's most recent games with basic box score stats.
 *
 * @param playerId - Internal player ID (not bref_id)
 * @param limit - Maximum number of games to return (default: 20)
 * @returns Array of recent game records, ordered by date (newest first)
 *
 * @example
 * const games = getPlayerRecentGames('12345', 5);
 * console.log(games[0].pts); // Points in most recent game
 */
export function getPlayerRecentGames(
  playerId: string,
  limit = 20
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT pgl.game_id, g.game_date, t.abbreviation as team_abbrev,
              pgl.minutes_played, pgl.pts, pgl.reb, pgl.ast, pgl.stl, pgl.blk,
              pgl.fgm, pgl.fga, pgl.fg3m, pgl.fg3a, pgl.ftm, pgl.fta
       FROM player_game_log pgl
       JOIN fact_game g ON g.game_id = pgl.game_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       WHERE pgl.player_id = ?
       ORDER BY g.game_date DESC
       LIMIT ?`
    )
    .all(playerId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves a player's complete game log with calculated Game Score.
 *
 * Game Score is a single-game productivity metric (similar to PER).
 * Formula based on John Hollinger's calculation:
 * PTS + 0.4*FG - 0.7*FGA - 0.4*(FTA-FTM) + 0.7*OREB + 0.3*DREB + STL + 0.7*AST + 0.7*BLK - 0.4*PF - TOV
 *
 * @param playerId - Internal player ID (not bref_id)
 * @param limit - Maximum number of games to return (default: 100)
 * @returns Array of game log records with W/L result and Game Score
 *
 * @example
 * const games = getPlayerFullGameLog('12345');
 * console.log(games[0].gmsc);     // Game Score
 * console.log(games[0].result);   // 'W' or 'L'
 */
export function getPlayerFullGameLog(
  playerId: string,
  limit = 100
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT pgl.game_id,
              g.game_date,
              t.abbreviation as team_abbrev,
              opp.abbreviation as opp_abbrev,
              CASE WHEN g.home_team_id = pgl.team_id THEN 1 ELSE 0 END AS is_home,
              pgl.minutes_played,
              pgl.fgm,
              pgl.fga,
              pgl.fg3m,
              pgl.fg3a,
              pgl.ftm,
              pgl.fta,
              pgl.reb,
              pgl.ast,
              pgl.stl,
              pgl.blk,
              pgl.tov,
              pgl.pf,
              pgl.pts,
              -- Determine win/loss based on team side and scores
              CASE
                WHEN (CASE WHEN g.home_team_id = pgl.team_id THEN g.home_score ELSE g.away_score END) >
                     (CASE WHEN g.home_team_id = pgl.team_id THEN g.away_score ELSE g.home_score END)
                THEN 'W'
                WHEN (CASE WHEN g.home_team_id = pgl.team_id THEN g.home_score ELSE g.away_score END) <
                     (CASE WHEN g.home_team_id = pgl.team_id THEN g.away_score ELSE g.home_score END)
                THEN 'L'
                ELSE 'T'
              END AS result,
              CASE WHEN g.home_team_id = pgl.team_id THEN g.home_score ELSE g.away_score END AS team_score,
              CASE WHEN g.home_team_id = pgl.team_id THEN g.away_score ELSE g.home_score END AS opp_score,
              -- Game Score calculation (Hollinger formula)
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
              ) AS gmsc,
              pgl.plus_minus
       FROM player_game_log pgl
       JOIN fact_game g ON g.game_id = pgl.game_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       JOIN dim_team opp ON opp.team_id = CASE WHEN g.home_team_id = pgl.team_id THEN g.away_team_id ELSE g.home_team_id END
       WHERE pgl.player_id = ?
       ORDER BY g.game_date DESC
       LIMIT ?`
    )
    .all(playerId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Return aggregated career statistics for a player against a specific opponent.
 *
 * @param playerId - Internal player ID (database id, not Basketball-Reference ID)
 * @param opponentTeamId - Internal team ID of the opponent
 * @returns A record with career stats vs the specified opponent
 * - `g`: number of matched games
 * - `pts`, `reb`, `ast`: summed totals for points, rebounds, and assists
 * - `pts_pg`, `reb_pg`, `ast_pg`: per-game averages rounded to one decimal place
 * Only games with a non-null final score are included.
 *
 * @example
 * const vsLakers = getPlayerVsOpponentStats('12345', '14'); // 14 = Lakers team_id
 * console.log(vsLakers.pts_pg); // Average points vs Lakers
 */
export function getPlayerVsOpponentStats(
  playerId: string,
  opponentTeamId: string
): Record<string, number | null> {
  return getDb()
    .prepare(
      `SELECT
          COUNT(*) AS g,
          SUM(pgl.pts) AS pts,
          SUM(pgl.reb) AS reb,
          SUM(pgl.ast) AS ast,
          ROUND(1.0 * SUM(pgl.pts) / COUNT(*), 1) AS pts_pg,
          ROUND(1.0 * SUM(pgl.reb) / COUNT(*), 1) AS reb_pg,
          ROUND(1.0 * SUM(pgl.ast) / COUNT(*), 1) AS ast_pg
       FROM player_game_log pgl
       JOIN fact_game fg ON fg.game_id = pgl.game_id
       WHERE pgl.player_id = ?
         -- Match games where opponent was home OR away team
         AND ((fg.home_team_id = pgl.team_id AND fg.away_team_id = ?) OR (fg.away_team_id = pgl.team_id AND fg.home_team_id = ?))
         AND fg.home_score IS NOT NULL`
    )
    .get(playerId, opponentTeamId, opponentTeamId) as Record<string, number | null>;
}
