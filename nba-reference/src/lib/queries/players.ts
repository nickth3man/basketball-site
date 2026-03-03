/**
 * @fileoverview Player data queries - retrieves comprehensive player statistics.
 *
 * This module provides 18+ query functions for player data:
 * - Basic player information and metadata
 * - Season statistics (per-game, per-36, per-100 possessions)
 * - Advanced metrics (PER, VORP, WS, BPM)
 * - Shooting data (distance breakdowns, shot types)
 * - Play-by-play derived stats (position estimates)
 * - Career summaries and totals
 * - Game logs and single-game highs
 * - Salary history and awards
 *
 * All queries use the cached database layer (30s TTL) for performance.
 *
 * @module @/lib/queries/players
 */

import { getDb } from '@/lib/db';

/**
 * Fetches a player's profile by Basketball-Reference ID.
 *
 * If the stored position is null or empty, uses the most recent non-empty position from the player's season stats.
 *
 * @param brefId - Basketball-Reference player ID (e.g., "jamesle01")
 * @returns The player record matching `brefId`, or `undefined` if not found
 */
export function getPlayerByBrefId(brefId: string):
  | {
      player_id: string;
      bref_id: string;
      full_name: string;
      first_name: string;
      last_name: string;
      position: string | null;
      height_cm: number | null;
      weight_kg: number | null;
      birth_date: string | null;
      birth_city: string | null;
      birth_country: string | null;
      college: string | null;
      draft_year: number | null;
      draft_round: number | null;
      draft_number: number | null;
      is_active: number;
      hof: number;
    }
  | undefined {
  return getDb()
    .prepare(
      `SELECT player_id, bref_id, full_name, first_name, last_name,
              COALESCE(
                position,
                (
                  -- Fallback: get most recent non-null position from stats
                  SELECT fps.pos
                  FROM fact_player_season_stats fps
                  WHERE fps.bref_player_id = dim_player.bref_id
                    AND fps.pos IS NOT NULL
                    AND fps.pos <> ''
                  ORDER BY fps.season_id DESC
                  LIMIT 1
                )
              ) AS position,
              height_cm, weight_kg, birth_date, birth_city, birth_country,
              college, draft_year, draft_round, draft_number, is_active, hof
       FROM dim_player
       WHERE bref_id = ?`
    )
    .get(brefId) as
    | {
        player_id: string;
        bref_id: string;
        full_name: string;
        first_name: string;
        last_name: string;
        position: string | null;
        height_cm: number | null;
        weight_kg: number | null;
        birth_date: string | null;
        birth_city: string | null;
        birth_country: string | null;
        college: string | null;
        draft_year: number | null;
        draft_round: number | null;
        draft_number: number | null;
        is_active: number;
        hof: number;
      }
    | undefined;
}

/**
 * Retrieves raw season totals for a player.
 *
 * Returns counting stats (games, minutes, points, rebounds, etc.)
 * without any per-game calculations.
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of season total records, ordered by season (newest first)
 */
export function getPlayerSeasonStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g, gs, mp, fg, fga, x3p, x3pa,
              ft, fta, reb, ast, stl, blk, tov, pf, pts
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves per-36-minutes statistics for a player.
 *
 * Per-36 is a normalized metric that shows what a player's stats would be
 * if they played 36 minutes per game (approximate starter minutes).
 * Calculation: stat * 36 / minutes_played
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of per-36 stats, ordered by season (newest first)
 */
export function getPlayerPer36Stats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, g, mp,
              -- Per-36 calculation: normalize stats to 36-minute basis
              CASE WHEN mp > 0 THEN ROUND(1.0 * pts * 36 / mp, 1) END AS pts_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * reb * 36 / mp, 1) END AS reb_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * ast * 36 / mp, 1) END AS ast_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * stl * 36 / mp, 1) END AS stl_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * blk * 36 / mp, 1) END AS blk_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * tov * 36 / mp, 1) END AS tov_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * pf * 36 / mp, 1) END AS pf_36
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves per-100-possessions statistics for a player.
 *
 * Per-100 normalizes stats to a per-possession basis, enabling fair
 * comparison across different pace/era teams.
 * Calculation: stat * 4800 / (minutes * team_pace)
 * - 4800 = 48 minutes * 100 possessions (standard game length)
 * - Team pace from fact_team_season, defaults to 100 if unavailable
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of per-100 stats, ordered by season (newest first)
 */
export function getPlayerPer100Stats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT pss.season_id, pss.team_abbrev, pss.g,
              -- Per-100 calculation: normalize to 100 possessions per 48 min game
              -- 4800 = 48 min * 100 possessions
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.pts * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS pts_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.reb * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS reb_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.ast * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS ast_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.stl * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS stl_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.blk * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS blk_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.tov * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS tov_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.fg * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS fg_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.fga * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS fga_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.x3p * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS x3p_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.x3pa * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS x3pa_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.ft * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS ft_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.fta * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS fta_100
       FROM fact_player_season_stats pss
       LEFT JOIN fact_team_season fts
         ON fts.season_id = pss.season_id
        AND fts.bref_abbrev = pss.team_abbrev
       WHERE pss.bref_player_id = ?
       ORDER BY pss.season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves per-game statistics for a player.
 *
 * Per-game stats are the most commonly viewed format, showing averages
 * per game played. Includes shooting percentages.
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of per-game stats, ordered by season (newest first)
 */
export function getPlayerPerGameStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g, gs,
              CASE WHEN g > 0 THEN ROUND(1.0 * mp / g, 1) END AS mp_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * pts / g, 1) END AS pts_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * reb / g, 1) END AS reb_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * ast / g, 1) END AS ast_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * stl / g, 1) END AS stl_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * blk / g, 1) END AS blk_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * tov / g, 1) END AS tov_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * pf / g, 1) END AS pf_pg,
              CASE WHEN fga > 0 THEN ROUND(1.0 * fg / fga, 3) END AS fg_pct,
              CASE WHEN x3pa > 0 THEN ROUND(1.0 * x3p / x3pa, 3) END AS fg3_pct,
              CASE WHEN fta > 0 THEN ROUND(1.0 * ft / fta, 3) END AS ft_pct
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves advanced statistics for a player.
 *
 * Advanced metrics provide deeper performance analysis:
 * - PER: Player Efficiency Rating (league average = 15)
 * - TS%: True Shooting% (accounts for 3P and FT)
 * - USG%: Usage Rate (% of team plays used)
 * - WS: Win Shares (total contribution)
 * - BPM/VORP: Box Plus-Minus / Value Over Replacement Player
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of advanced stats, ordered by season (newest first)
 */
export function getPlayerAdvancedSeasonStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g, mp,
              per, ts_pct, x3p_ar, f_tr,
              orb_pct, drb_pct, trb_pct, ast_pct, stl_pct, blk_pct, tov_pct,
              usg_pct, ows, dws, ws, ws_48, obpm, dbpm, bpm, vorp
       FROM fact_player_advanced_season
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves shooting breakdown statistics for a player.
 *
 * Shows shot distribution by distance and accuracy:
 * - % of FGA from each distance zone (0-3ft, 3-10ft, 10-16ft, 16-3P, 3P)
 * - FG% from each zone
 * - Corner 3 stats (higher value shots)
 * - Dunk frequency
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of shooting stats, ordered by season (newest first)
 */
export function getPlayerShootingSeasonStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, g, mp, avg_dist_fga,
              pct_fga_0_3, pct_fga_3_10, pct_fga_10_16, pct_fga_16_3p, pct_fga_3p,
              fg_pct_0_3, fg_pct_3_10, fg_pct_10_16, fg_pct_16_3p, fg_pct_3p,
              pct_ast_2p, pct_ast_3p,
              pct_dunks_fga, num_dunks,
              pct_corner3_3pa, corner3_pct
       FROM fact_player_shooting_season
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves adjusted shooting statistics with league-relative metrics.
 *
 * Adjusted shooting compares player efficiency to league average:
 * - eFG+ / TS+: 100 = league average, >100 = above average
 * - Calculated against league averages from team_game_log
 *
 * This provides era-adjusted context for shooting efficiency.
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of adjusted shooting stats, ordered by season (newest first)
 */
export function getPlayerAdjustedShootingStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT pss.season_id,
              pss.team_abbrev,
              pss.g,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * pss.fg / pss.fga, 3) END AS fg_pct,
              CASE WHEN pss.x3pa > 0 THEN ROUND(1.0 * pss.x3p / pss.x3pa, 3) END AS fg3_pct,
              CASE WHEN pss.fta > 0 THEN ROUND(1.0 * pss.ft / pss.fta, 3) END AS ft_pct,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * (pss.fg + 0.5 * pss.x3p) / pss.fga, 3) END AS efg_pct,
              CASE WHEN (pss.fga + 0.44 * pss.fta) > 0 THEN ROUND(1.0 * pss.pts / (2 * (pss.fga + 0.44 * pss.fta)), 3) END AS ts_pct,
              -- League-relative metrics: 100 = league average
              CASE WHEN lg.avg_efg IS NOT NULL AND lg.avg_efg > 0 AND pss.fga > 0
                THEN ROUND(100.0 * ((pss.fg + 0.5 * pss.x3p) * 1.0 / pss.fga) / lg.avg_efg, 0)
              END AS efg_plus,
              CASE WHEN lg.avg_ts IS NOT NULL AND lg.avg_ts > 0 AND (pss.fga + 0.44 * pss.fta) > 0
                THEN ROUND(100.0 * (pss.pts * 1.0 / (2 * (pss.fga + 0.44 * pss.fta))) / lg.avg_ts, 0)
              END AS ts_plus,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * pss.x3pa / pss.fga, 3) END AS x3p_ar,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * pss.fta / pss.fga, 3) END AS f_tr
       FROM fact_player_season_stats pss
       LEFT JOIN (
         -- Calculate league averages per season from team game logs
         SELECT season_id,
                CASE WHEN SUM(fga) > 0 THEN 1.0 * SUM(fgm + 0.5 * fg3m) / SUM(fga) END AS avg_efg,
                CASE WHEN SUM(fga + 0.44 * fta) > 0 THEN 1.0 * SUM(pts) / (2 * SUM(fga + 0.44 * fta)) END AS avg_ts
         FROM team_game_log tgl
         JOIN fact_game fg ON fg.game_id = tgl.game_id
         WHERE fg.season_type = 'Regular Season'
         GROUP BY fg.season_id
       ) lg ON lg.season_id = pss.season_id
       WHERE pss.bref_player_id = ?
       ORDER BY pss.season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves play-by-play derived statistics for a player.
 *
 * PBP stats estimate position played (PG/SG/SF/PF/C percentages)
 * based on who they shared the court with.
 * Also includes turnover types and fouls drawn.
 *
 * @param brefId - Basketball-Reference player ID
 * @param limit - Maximum number of seasons to return (default: 25)
 * @returns Array of PBP stats, ordered by season (newest first)
 */
export function getPlayerPbpSeasonStats(
  brefId: string,
  limit = 25
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, g, mp,
              pg_pct, sg_pct, sf_pct, pf_pct, c_pct,
              on_court_pm_per100, net_pm_per100,
              bad_pass_tov, lost_ball_tov,
              shoot_foul_drawn, off_foul_drawn, and1
       FROM fact_player_pbp_season
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves a player's most recent games with basic box score stats.
 *
 * @param playerId - Internal player ID (not bref_id)
 * @param limit - Maximum number of games to return (default: 20)
 * @returns Array of recent game records, ordered by date (newest first)
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
 * Retrieves a player's awards and honors.
 *
 * @param playerId - Internal player ID (not bref_id)
 * @param limit - Maximum number of awards to return (default: 100)
 * @returns Array of award records, ordered by season (newest first)
 */
export function getPlayerAwards(
  playerId: string,
  limit = 100
): Array<{ season_id: string; award_name: string; award_type: string }> {
  return getDb()
    .prepare(
      `SELECT season_id, award_name, award_type
       FROM fact_player_award
       WHERE player_id = ?
       ORDER BY season_id DESC, award_name ASC
       LIMIT ?`
    )
    .all(playerId, limit) as Array<{
    season_id: string;
    award_name: string;
    award_type: string;
  }>;
}

/**
 * Retrieves a player's salary history by season.
 *
 * @param playerId - Internal player ID (not bref_id)
 * @param limit - Maximum number of salary records to return (default: 50)
 * @returns Array of salary records with team, ordered by season (newest first)
 */
export function getPlayerSalaries(
  playerId: string,
  limit = 50
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT fs.season_id, dt.abbreviation as team_abbrev, fs.salary
       FROM fact_salary fs
       JOIN dim_team dt ON dt.team_id = fs.team_id
       WHERE fs.player_id = ?
       ORDER BY fs.season_id DESC
       LIMIT ?`
    )
    .all(playerId, limit) as Array<Record<string, number | string | null>>;
}

/**
 * Retrieves career summary statistics for a player.
 *
 * Aggregates totals across all seasons and calculates per-game averages
 * and shooting percentages.
 *
 * @param brefId - Basketball-Reference player ID
 * @returns Career totals and averages record
 */
export function getPlayerCareerSummary(brefId: string): Record<string, number | null> {
  return getDb()
    .prepare(
      `SELECT
          SUM(g) AS g,
          SUM(pts) AS pts,
          SUM(reb) AS reb,
          SUM(ast) AS ast,
          CASE WHEN SUM(g) > 0 THEN ROUND(1.0 * SUM(pts) / SUM(g), 1) END AS pts_pg,
          CASE WHEN SUM(g) > 0 THEN ROUND(1.0 * SUM(reb) / SUM(g), 1) END AS reb_pg,
          CASE WHEN SUM(g) > 0 THEN ROUND(1.0 * SUM(ast) / SUM(g), 1) END AS ast_pg,
          CASE WHEN SUM(fga) > 0 THEN ROUND(1.0 * SUM(fg) / SUM(fga), 3) END AS fg_pct,
          CASE WHEN SUM(x3pa) > 0 THEN ROUND(1.0 * SUM(x3p) / SUM(x3pa), 3) END AS fg3_pct,
          CASE WHEN SUM(fta) > 0 THEN ROUND(1.0 * SUM(ft) / SUM(fta), 3) END AS ft_pct
       FROM fact_player_season_stats
       WHERE bref_player_id = ?`
    )
    .get(brefId) as Record<string, number | null>;
}

/**
 * Retrieves a player's career single-game highs across major box-score categories.
 *
 * @param playerId - Internal player ID (database identifier, not Basketball-Reference ID)
 * @returns A record with keys `mp`, `fg`, `fga`, `fg3`, `fg3a`, `ft`, `fta`, `pts`, `reb`, `ast`, `stl`, `blk`, `tov`, `pf`, and `plus_minus` mapping to the career single-game maximum for each stat, or `null` if no value exists.
 */
export function getPlayerGameHighs(playerId: string): Record<string, number | null> {
  return getDb()
    .prepare(
      `SELECT
          MAX(minutes_played) AS mp,
          MAX(fgm) AS fg,
          MAX(fga) AS fga,
          MAX(fg3m) AS fg3,
          MAX(fg3a) AS fg3a,
          MAX(ftm) AS ft,
          MAX(fta) AS fta,
          MAX(pts) AS pts,
          MAX(reb) AS reb,
          MAX(ast) AS ast,
          MAX(stl) AS stl,
          MAX(blk) AS blk,
          MAX(tov) AS tov,
          MAX(pf) AS pf,
          MAX(plus_minus) AS plus_minus
       FROM player_game_log
       WHERE player_id = ?`
    )
    .get(playerId) as Record<string, number | null>;
}

/**
 * Retrieves career totals for a player across all seasons.
 *
 * @param brefId - Basketball-Reference player ID
 * @returns A record mapping stat names (`g`, `mp`, `fg`, `fga`, `x3p`, `x3pa`, `ft`, `fta`, `reb`, `ast`, `stl`, `blk`, `tov`, `pf`, `pts`) to their summed totals; values may be `null` if no data exists
 */
export function getPlayerCareerTotals(brefId: string): Record<string, number | null> {
  return getDb()
    .prepare(
      `SELECT
          SUM(g) AS g,
          SUM(mp) AS mp,
          SUM(fg) AS fg,
          SUM(fga) AS fga,
          SUM(x3p) AS x3p,
          SUM(x3pa) AS x3pa,
          SUM(ft) AS ft,
          SUM(fta) AS fta,
          SUM(reb) AS reb,
          SUM(ast) AS ast,
          SUM(stl) AS stl,
          SUM(blk) AS blk,
          SUM(tov) AS tov,
          SUM(pf) AS pf,
          SUM(pts) AS pts
       FROM fact_player_season_stats
       WHERE bref_player_id = ?`
    )
    .get(brefId) as Record<string, number | null>;
}

/**
 * Return aggregated career statistics for a player against a specific opponent.
 *
 * @param playerId - Internal player ID (database id, not Basketball-Reference ID)
 * @param opponentTeamId - Internal team ID of the opponent
 * @returns A record with the following fields:
 * - `g`: number of matched games
 * - `pts`, `reb`, `ast`: summed totals for points, rebounds, and assists
 * - `pts_pg`, `reb_pg`, `ast_pg`: per-game averages rounded to one decimal place
 * Only games with a non-null final score are included.
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
