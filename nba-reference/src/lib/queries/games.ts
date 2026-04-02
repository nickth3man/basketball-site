/**
 * @fileoverview Game data queries - retrieves box scores, play-by-play, and game details.
 *
 * This module provides query functions for game data:
 * - Basic game information (date, teams, scores, status)
 * - Player box scores (traditional stats)
 * - Advanced player box scores (eFG%, TS%, Game Score)
 * - Team box scores and Four Factors
 * - Play-by-play event streams (text and structured shot-detail modes)
 * - Line score by period
 *
 * All queries use the cached database layer (30s TTL) for performance.
 *
 * @module @/lib/queries/games
 */

import { getCachedQueryMany, getDb } from '@/lib/db';

/**
 * Structured shot event derived from a play-by-play row.
 *
 * Fields are parsed from the free-text description columns because the
 * `fact_play_by_play` table does not yet store structured shot columns
 * (see `docs/data-pipeline-contract.md` for the full schema audit and
 * proposed additions).
 */
export interface ShotEvent {
  event_id: string;
  period: number;
  pc_time_string: string | null;
  home_description: string | null;
  visitor_description: string | null;
  score: string | null;
  /** 1 = made field goal, 2 = missed field goal */
  eventmsgtype: number;
  player_name: string | null;
  team: string | null;
  shot_result: 'made' | 'missed';
  /** Parsed shot type label, e.g. "Jump Shot", "Layup", "Dunk", "3-Point" */
  shot_type: string | null;
  /** Shot distance in feet parsed from description, or null if not found */
  shot_distance: number | null;
  /** Inferred shot zone from distance + shot type */
  shot_zone: string | null;
  assisted: boolean;
  /** 2 or 3 depending on whether description contains "3PT" */
  shot_value: 2 | 3 | null;
}

/**
 * Parse structured shot metadata from a PBP event description.
 *
 * This is a best-effort parser that extracts shot type, distance, zone, assist
 * flag, and shot value from the free-text description strings stored in
 * `fact_play_by_play`. It is used in `getGamePbpWithShotDetails` to produce
 * the `ShotEvent` shape until the ETL pipeline provides structured columns
 * (see `docs/data-pipeline-contract.md`).
 *
 * @param description - The non-null description string from the PBP row
 * @param eventmsgtype - 1 for made shot, 2 for missed shot
 */
function parseShotDescription(
  description: string,
  eventmsgtype: number
): Pick<
  ShotEvent,
  'shot_type' | 'shot_distance' | 'shot_zone' | 'assisted' | 'shot_value' | 'shot_result'
> {
  if (description.trim() === '') {
    return {
      shot_type: null,
      shot_distance: null,
      shot_zone: null,
      assisted: false,
      shot_value: null,
      shot_result: eventmsgtype === 1 ? 'made' : 'missed',
    };
  }

  const is3pt = description.includes('3PT');
  const distanceExec = /(\d+)'/.exec(description);
  const shotDistance = distanceExec?.[1] != null ? parseInt(distanceExec[1], 10) : null;
  const assisted = /\d+\s+AST\)|AST\)/.test(description);

  let shotType: string | null;
  if (is3pt) {
    shotType = '3-Point';
  } else if (/dunk/i.test(description)) {
    shotType = 'Dunk';
  } else if (/alley.?oop/i.test(description)) {
    shotType = 'Alley Oop';
  } else if (/layup/i.test(description)) {
    shotType = 'Layup';
  } else if (/hook/i.test(description)) {
    shotType = 'Hook Shot';
  } else if (/tip/i.test(description)) {
    shotType = 'Tip Shot';
  } else if (/floater/i.test(description)) {
    shotType = 'Floater';
  } else if (/pull.?up/i.test(description)) {
    shotType = 'Pull-Up Jump Shot';
  } else if (/step.?back/i.test(description)) {
    shotType = 'Step-Back Jump Shot';
  } else if (/fadeaway/i.test(description)) {
    shotType = 'Fadeaway';
  } else if (/jump/i.test(description)) {
    shotType = 'Jump Shot';
  } else {
    shotType = 'Field Goal';
  }

  let shotZone: string | null;
  if (is3pt) {
    shotZone = shotDistance !== null && shotDistance <= 22 ? 'Corner 3' : 'Above Break 3';
  } else if (
    /dunk|alley.?oop/i.test(description) ||
    shotType === 'Layup' ||
    (shotDistance !== null && shotDistance <= 4)
  ) {
    shotZone = 'Restricted Area';
  } else if (shotDistance !== null && shotDistance <= 8) {
    shotZone = 'In The Paint';
  } else if (shotDistance !== null && shotDistance <= 16) {
    shotZone = 'Mid-Range';
  } else if (shotDistance !== null) {
    shotZone = 'Long 2';
  } else {
    shotZone = null;
  }

  return {
    shot_type: shotType,
    shot_distance: shotDistance,
    shot_zone: shotZone,
    assisted,
    shot_value: is3pt ? 3 : 2,
    shot_result: eventmsgtype === 1 ? 'made' : 'missed',
  };
}

/**
 * Retrieve basic game information for the specified game ID.
 *
 * @param gameId - Game identifier (e.g., "0022400001")
 * @returns A record containing game fields (date, season type, status, home/away scores) and home/away team names and abbreviations, or `undefined` if not found
 */
export function getGameById(gameId: string): Record<string, string | number | null> | undefined {
  return getDb()
    .prepare(
      `SELECT g.game_id, g.game_date, g.season_type, g.status,
              g.home_score, g.away_score,
              ht.abbreviation as home_abbrev, ht.full_name as home_name,
              at.abbreviation as away_abbrev, at.full_name as away_name
       FROM fact_game g
       JOIN dim_team ht ON ht.team_id = g.home_team_id
       JOIN dim_team at ON at.team_id = g.away_team_id
       WHERE g.game_id = ?`
    )
    .get(gameId) as Record<string, string | number | null> | undefined;
}

/**
 * Return the most significant play-by-play events for a game, ordered from newest to oldest.
 *
 * Only events that include a home or visitor description are returned; results are ordered by period (descending)
 * then clock time (descending) and limited by `limit`.
 *
 * @param gameId - Game identifier
 * @param limit - Maximum number of events to return (default: 40)
 * @returns An array of play-by-play records, each containing `period`, `pc_time_string`, `home_description`, `visitor_description`, and `score`
 */
export function getGamePbpEvents(
  gameId: string,
  limit = 40
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT period, pc_time_string, home_description, visitor_description, score
       FROM fact_play_by_play
       WHERE game_id = ?
         AND (home_description IS NOT NULL OR visitor_description IS NOT NULL)
       ORDER BY period DESC, pc_time_string DESC
       LIMIT ?`
    )
    .all(gameId, limit) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieve traditional player box score statistics for a game.
 *
 * Results include team abbreviation, player identifiers and name, starter flag, minutes played,
 * standard counting stats (FGM/FGA, 3PM/3PA, FTM/FTA, rebounds, assists, steals, blocks, turnovers, fouls),
 * points, and plus/minus. Rows are ordered by team abbreviation (A–Z), starters before reserves, then minutes played descending.
 *
 * @param gameId - Unique identifier of the game to query
 * @returns An array of player box score records matching the game, or an empty array if no records exist
 */
export function getGamePlayerBoxScore(
  gameId: string
): Array<Record<string, string | number | null>> {
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
       ORDER BY t.abbreviation ASC, pgl.starter DESC, pgl.minutes_played DESC`
    )
    .all(gameId) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieve advanced player box score statistics for a specific game.
 *
 * Computes player-level advanced metrics: effective field goal percentage (`efg_pct`),
 * true shooting percentage (`ts_pct`), turnover percentage (`tov_pct`), and Hollinger
 * single-game `game_score`. Results are ordered by team abbreviation and then by
 * `game_score` descending.
 *
 * @param gameId - Identifier of the game to query
 * @returns Array of records with keys: `team`, `bref_id`, `full_name`, `minutes_played`,
 * `efg_pct`, `ts_pct`, `tov_pct`, and `game_score`
 */
export function getGamePlayerAdvancedBoxScore(
  gameId: string
): Array<Record<string, string | number | null>> {
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
       ORDER BY t.abbreviation ASC, game_score DESC`
    )
    .all(gameId) as Array<Record<string, string | number | null>>;
}

/**
 * Compute the Four Factors for each team in a game.
 *
 * Calculates effective field goal percentage (eFG%), turnover percentage (TOV%),
 * offensive rebounding percentage (ORB%), free throws per field goal attempt (FT/FGA),
 * and defensive rebounding percentage (DRB%) for both teams and returns one record per team.
 * If a metric cannot be computed due to zero denominators, the corresponding value is `null`.
 *
 * @param gameId - Game identifier
 * @returns An array of records (one per team) with fields:
 * - `team`: team abbreviation
 * - `efg_pct`: effective field goal percentage (number | null)
 * - `tov_pct`: turnover percentage (number | null)
 * - `orb_pct`: offensive rebounding percentage (number | null)
 * - `ft_fga`: free throws made per field goal attempt (number | null)
 * - `drb_pct`: defensive rebounding percentage (number | null)
 */
export function getGameTeamFourFactors(gameId: string): Array<{
  team: string | number | null;
  efg_pct: number | null;
  tov_pct: number | null;
  orb_pct: number | null;
  ft_fga: number | null;
  drb_pct: number | null;
}> {
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
       ORDER BY t.abbreviation ASC`
    )
    .all(gameId) as Array<Record<string, number | string | null>>;

  return rows.map(row => {
    const fieldGoalsMade = Number(row['fgm'] ?? 0);
    const fieldGoalsAttempted = Number(row['fga'] ?? 0);
    const threePointersMade = Number(row['fg3m'] ?? 0);
    const freeThrowsMade = Number(row['ftm'] ?? 0);
    const freeThrowsAttempted = Number(row['fta'] ?? 0);
    const offensiveRebounds = Number(row['oreb'] ?? 0);
    const defensiveRebounds = Number(row['dreb'] ?? 0);
    const turnovers = Number(row['tov'] ?? 0);
    const opponentOffensiveRebounds = Number(row['opp_oreb'] ?? 0);
    const opponentDefensiveRebounds = Number(row['opp_dreb'] ?? 0);

    // Estimated possessions for TOV% calculation
    const possessions = fieldGoalsAttempted + 0.44 * freeThrowsAttempted + turnovers;

    return {
      team: row['team'] ?? null,
      // eFG%: Accounts for 3P being worth 1.5x a 2P
      efg_pct:
        fieldGoalsAttempted > 0
          ? Number(((fieldGoalsMade + 0.5 * threePointersMade) / fieldGoalsAttempted).toFixed(3))
          : null,
      // TOV%: Percentage of possessions ending in turnover
      tov_pct: possessions > 0 ? Number(((100 * turnovers) / possessions).toFixed(1)) : null,
      // ORB%: Percentage of available offensive rebounds grabbed
      orb_pct:
        offensiveRebounds + opponentDefensiveRebounds > 0
          ? Number(
              ((100 * offensiveRebounds) / (offensiveRebounds + opponentDefensiveRebounds)).toFixed(
                1
              )
            )
          : null,
      // FT/FGA: Free throws made per field goal attempt
      ft_fga:
        fieldGoalsAttempted > 0 ? Number((freeThrowsMade / fieldGoalsAttempted).toFixed(3)) : null,
      // DRB%: Percentage of available defensive rebounds grabbed
      drb_pct:
        defensiveRebounds + opponentOffensiveRebounds > 0
          ? Number(
              ((100 * defensiveRebounds) / (defensiveRebounds + opponentOffensiveRebounds)).toFixed(
                1
              )
            )
          : null,
    };
  });
}

/**
 * Compute each team's points scored in each period for a game.
 *
 * Parses cumulative score entries from play-by-play and converts them into per-period points. Rows with nonstandard or unparsable score values are ignored.
 *
 * @param gameId - The game identifier used to fetch play-by-play score entries
 * @returns Array of objects with `period` (period number), `away` (away team points in that period), and `home` (home team points in that period)
 */
export function getGameLineScore(
  gameId: string
): Array<{ period: number; away: number; home: number }> {
  const rows = getDb()
    .prepare(
      `SELECT period, score
       FROM fact_play_by_play
       WHERE game_id = ?
         AND score IS NOT NULL
       ORDER BY period ASC, event_id ASC`
    )
    .all(gameId) as Array<{ period: number; score: string }>;

  const periodEndTotals = new Map<number, { away: number; home: number }>();

  for (const row of rows) {
    // Parse "away-home" score format (e.g., "45-52")
    const parts = row.score.split('-');
    if (parts.length !== 2) continue;
    const away = Number(parts[0]);
    const home = Number(parts[1]);
    if (Number.isNaN(away) || Number.isNaN(home)) continue;

    // Store the last cumulative score seen for each period
    periodEndTotals.set(row.period, { away, home });
  }

  // Calculate period deltas from the cumulative totals
  const result = [];
  let prevAway = 0;
  let prevHome = 0;

  const sortedPeriods = Array.from(periodEndTotals.entries()).sort(
    ([leftPeriod], [rightPeriod]) => leftPeriod - rightPeriod
  );

  for (const [period, { away, home }] of sortedPeriods) {
    result.push({
      period,
      away: away - prevAway,
      home: home - prevHome,
    });
    prevAway = away;
    prevHome = home;
  }

  return result;
}

/**
 * Retrieves team-level box score statistics.
 *
 * @param gameId - Game ID
 * @returns Array of team box score records (typically 2: home and away)
 */
export function getGameTeamBoxScores(
  gameId: string
): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT t.abbreviation as team, tgl.fgm, tgl.fga, tgl.fg3m, tgl.fg3a,
              tgl.ftm, tgl.fta, tgl.reb, tgl.ast, tgl.stl, tgl.blk, tgl.tov,
              tgl.pf, tgl.pts
       FROM team_game_log tgl
       JOIN dim_team t ON t.team_id = tgl.team_id
       WHERE tgl.game_id = ?
       ORDER BY t.abbreviation`
    )
    .all(gameId) as Array<Record<string, string | number | null>>;
}

/**
 * Return structured shot-detail events for a game.
 *
 * Only made and missed field goal events (`eventmsgtype` 1 or 2) are returned.
 * Shot metadata (type, distance, zone, assist flag, shot value) is parsed from
 * the free-text description columns since `fact_play_by_play` does not yet
 * carry dedicated structured columns (see `docs/data-pipeline-contract.md`).
 *
 * Results are ordered chronologically (period ASC, clock DESC).
 *
 * @param gameId - Game identifier
 * @param limit - Maximum number of shot events to return (default: 500)
 * @returns Array of {@link ShotEvent} records with parsed shot details
 */
export function getGamePbpWithShotDetails(gameId: string, limit = 500): ShotEvent[] {
  const rows = getCachedQueryMany<Array<Record<string, string | number | null>>>(
    `SELECT pbp.event_id,
            pbp.period,
            pbp.pc_time_string,
            pbp.home_description,
            pbp.visitor_description,
            pbp.score,
            pbp.eventmsgtype,
            p.full_name AS player_name,
            t.abbreviation AS team
     FROM fact_play_by_play pbp
     LEFT JOIN dim_player p ON p.player_id = pbp.player1_id
     LEFT JOIN dim_team t ON t.team_id = pbp.team1_id
     WHERE pbp.game_id = ?
       AND pbp.eventmsgtype IN (1, 2)
     ORDER BY pbp.period ASC, pbp.pc_time_string DESC
     LIMIT ?`,
    [gameId, limit],
    30_000
  );

  return rows.map(row => {
    const description = String(row['home_description'] ?? row['visitor_description'] ?? '');
    const eventmsgtype = Number(row['eventmsgtype']);
    const parsed = parseShotDescription(description, eventmsgtype);

    return {
      event_id: String(row['event_id'] ?? ''),
      period: Number(row['period']),
      pc_time_string: row['pc_time_string'] != null ? String(row['pc_time_string']) : null,
      home_description: row['home_description'] != null ? String(row['home_description']) : null,
      visitor_description:
        row['visitor_description'] != null ? String(row['visitor_description']) : null,
      score: row['score'] != null ? String(row['score']) : null,
      eventmsgtype,
      player_name: row['player_name'] != null ? String(row['player_name']) : null,
      team: row['team'] != null ? String(row['team']) : null,
      ...parsed,
    };
  });
}
