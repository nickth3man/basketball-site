import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';

export interface PlayerSplitRow {
  split_value: string;
  g: number;
  mp: number;
  pts: number;
  reb: number;
  ast: number;
  fg: number;
  fga: number;
  x3p: number;
  x3pa: number;
  ft: number;
  fta: number;
}

function processSplits(
  rows: Array<{
    split_value: string;
    g: number;
    mp: number;
    pts: number;
    reb: number;
    ast: number;
    fg: number;
    fga: number;
    x3p: number;
    x3pa: number;
    ft: number;
    fta: number;
  }>
): PlayerSplitRow[] {
  return rows.map(row => ({
    split_value: row.split_value,
    g: row.g,
    mp: row.mp,
    pts: row.pts,
    reb: row.reb,
    ast: row.ast,
    fg: row.fg,
    fga: row.fga,
    x3p: row.x3p,
    x3pa: row.x3pa,
    ft: row.ft,
    fta: row.fta,
  }));
}

export function getPlayerHomeAwaySplits(playerId: string, seasonId?: string): PlayerSplitRow[] {
  const seasonFilter = hasSeasonId(seasonId) ? 'AND g.season_id = ?' : '';
  const params = hasSeasonId(seasonId) ? [playerId, seasonId] : [playerId];

  const rows = getCachedQueryMany<
    Array<{
      split_value: string;
      g: number;
      mp: number;
      pts: number;
      reb: number;
      ast: number;
      fg: number;
      fga: number;
      x3p: number;
      x3pa: number;
      ft: number;
      fta: number;
    }>
  >(
    `SELECT 
      CASE WHEN g.home_team_id = pgl.team_id THEN 'Home' ELSE 'Away' END as split_value,
      COUNT(*) as g,
      SUM(pgl.minutes_played) as mp,
      SUM(pgl.pts) as pts,
      SUM(pgl.reb) as reb,
      SUM(pgl.ast) as ast,
      SUM(pgl.fgm) as fg,
      SUM(pgl.fga) as fga,
      SUM(pgl.fg3m) as x3p,
      SUM(pgl.fg3a) as x3pa,
      SUM(pgl.ftm) as ft,
      SUM(pgl.fta) as fta
    FROM player_game_log pgl
    JOIN fact_game g ON g.game_id = pgl.game_id
    WHERE pgl.player_id = ?
      AND g.status = 'Final'
      ${seasonFilter}
    GROUP BY split_value
    ORDER BY split_value DESC`,
    params,
    60_000
  );

  return processSplits(rows);
}

export function getPlayerMonthlySplits(playerId: string, seasonId?: string): PlayerSplitRow[] {
  const seasonFilter = hasSeasonId(seasonId) ? 'AND g.season_id = ?' : '';
  const params = hasSeasonId(seasonId) ? [playerId, seasonId] : [playerId];

  const rows = getCachedQueryMany<
    Array<{
      split_value: string;
      g: number;
      mp: number;
      pts: number;
      reb: number;
      ast: number;
      fg: number;
      fga: number;
      x3p: number;
      x3pa: number;
      ft: number;
      fta: number;
    }>
  >(
    `SELECT 
      CASE strftime('%m', g.game_date)
        WHEN '01' THEN 'January'
        WHEN '02' THEN 'February'
        WHEN '03' THEN 'March'
        WHEN '04' THEN 'April'
        WHEN '10' THEN 'October'
        WHEN '11' THEN 'November'
        WHEN '12' THEN 'December'
      END as split_value,
      COUNT(*) as g,
      SUM(pgl.minutes_played) as mp,
      SUM(pgl.pts) as pts,
      SUM(pgl.reb) as reb,
      SUM(pgl.ast) as ast,
      SUM(pgl.fgm) as fg,
      SUM(pgl.fga) as fga,
      SUM(pgl.fg3m) as x3p,
      SUM(pgl.fg3a) as x3pa,
      SUM(pgl.ftm) as ft,
      SUM(pgl.fta) as fta
    FROM player_game_log pgl
    JOIN fact_game g ON g.game_id = pgl.game_id
    WHERE pgl.player_id = ?
      AND g.status = 'Final'
      ${seasonFilter}
    GROUP BY strftime('%m', g.game_date)
    ORDER BY strftime('%m', g.game_date)`,
    params,
    60_000
  );

  return processSplits(rows);
}

export function getPlayerOpponentSplits(playerId: string, seasonId?: string): PlayerSplitRow[] {
  const seasonFilter = hasSeasonId(seasonId) ? 'AND g.season_id = ?' : '';
  const params = hasSeasonId(seasonId) ? [playerId, seasonId] : [playerId];

  const rows = getCachedQueryMany<
    Array<{
      split_value: string;
      g: number;
      mp: number;
      pts: number;
      reb: number;
      ast: number;
      fg: number;
      fga: number;
      x3p: number;
      x3pa: number;
      ft: number;
      fta: number;
    }>
  >(
    `SELECT 
      opp.full_name as split_value,
      COUNT(*) as g,
      SUM(pgl.minutes_played) as mp,
      SUM(pgl.pts) as pts,
      SUM(pgl.reb) as reb,
      SUM(pgl.ast) as ast,
      SUM(pgl.fgm) as fg,
      SUM(pgl.fga) as fga,
      SUM(pgl.fg3m) as x3p,
      SUM(pgl.fg3a) as x3pa,
      SUM(pgl.ftm) as ft,
      SUM(pgl.fta) as fta
    FROM player_game_log pgl
    JOIN fact_game g ON g.game_id = pgl.game_id
    JOIN dim_team opp ON opp.team_id = CASE 
      WHEN g.home_team_id = pgl.team_id THEN g.away_team_id 
      ELSE g.home_team_id 
    END
    WHERE pgl.player_id = ?
      AND g.status = 'Final'
      ${seasonFilter}
    GROUP BY opp.team_id, opp.full_name
    ORDER BY g DESC`,
    params,
    60_000
  );

  return processSplits(rows);
}

export function getPlayerDivisionSplits(playerId: string, seasonId?: string): PlayerSplitRow[] {
  const seasonFilter = hasSeasonId(seasonId) ? 'AND g.season_id = ?' : '';
  const params = hasSeasonId(seasonId) ? [playerId, seasonId] : [playerId];

  const rows = getCachedQueryMany<
    Array<{
      split_value: string;
      g: number;
      mp: number;
      pts: number;
      reb: number;
      ast: number;
      fg: number;
      fga: number;
      x3p: number;
      x3pa: number;
      ft: number;
      fta: number;
    }>
  >(
    `SELECT 
      COALESCE(opp.division, 'Unknown') as split_value,
      COUNT(*) as g,
      SUM(pgl.minutes_played) as mp,
      SUM(pgl.pts) as pts,
      SUM(pgl.reb) as reb,
      SUM(pgl.ast) as ast,
      SUM(pgl.fgm) as fg,
      SUM(pgl.fga) as fga,
      SUM(pgl.fg3m) as x3p,
      SUM(pgl.fg3a) as x3pa,
      SUM(pgl.ftm) as ft,
      SUM(pgl.fta) as fta
    FROM player_game_log pgl
    JOIN fact_game g ON g.game_id = pgl.game_id
    JOIN dim_team opp ON opp.team_id = CASE 
      WHEN g.home_team_id = pgl.team_id THEN g.away_team_id 
      ELSE g.home_team_id 
    END
    WHERE pgl.player_id = ?
      AND g.status = 'Final'
      ${seasonFilter}
    GROUP BY opp.division
    ORDER BY g DESC`,
    params,
    60_000
  );

  return processSplits(rows);
}

export function getPlayerLatestSeason(playerId: string): string | undefined {
  const row = getCachedQueryOne<{ season_id: string } | undefined>(
    `SELECT MAX(season_id) as season_id
    FROM fact_game g
    JOIN player_game_log pgl ON pgl.game_id = g.game_id
    WHERE pgl.player_id = ?`,
    [playerId],
    60_000
  );
  return row?.season_id;
}

export function getPlayerSplitSeasons(playerId: string): string[] {
  const rows = getCachedQueryMany<Array<{ season_id: string }>>(
    `SELECT DISTINCT g.season_id AS season_id
     FROM fact_game g
     JOIN player_game_log pgl ON pgl.game_id = g.game_id
     WHERE pgl.player_id = ?
       AND g.season_id IS NOT NULL
     ORDER BY g.season_id DESC`,
    [playerId],
    60_000
  );

  return rows
    .map(row => row.season_id)
    .filter((seasonId): seasonId is string => seasonId.length > 0);
}

function hasSeasonId(seasonId: string | undefined): seasonId is string {
  return seasonId != null && seasonId.length > 0;
}
