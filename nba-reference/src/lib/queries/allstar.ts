/**
 * @fileoverview All-Star data queries - retrieves All-Star game rosters and history.
 *
 * @module @/lib/queries/allstar
 */

import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';

/**
 * Get all seasons that have All-Star games.
 */
export function getAllStarSeasons(): Array<{
  season_id: string;
  start_year: number;
  end_year: number;
  player_count: number;
}> {
  return getCachedQueryMany(
    `SELECT 
      s.season_id,
      s.start_year,
      s.end_year,
      COUNT(DISTINCT fas.player_id) as player_count
    FROM fact_all_star fas
    JOIN dim_season s ON s.season_id = fas.season_id
    GROUP BY s.season_id, s.start_year, s.end_year
    ORDER BY s.start_year DESC`,
    [],
    60_000
  ) as Array<{ season_id: string; start_year: number; end_year: number; player_count: number }>;
}

/**
 * Get All-Star rosters for a specific season.
 */
export function getAllStarRosters(seasonId: string): {
  teams: Array<{
    team_name: string;
    players: Array<{
      bref_id: string;
      full_name: string;
      team_abbrev: string | null;
      is_starter: number;
      is_replacement: number;
    }>;
  }>;
} {
  const players = getCachedQueryMany(
    `SELECT 
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev,
      fas.selection_team as team_name,
      fas.is_starter,
      fas.is_replacement
    FROM fact_all_star fas
    JOIN dim_player p ON p.bref_id = fas.player_id
    LEFT JOIN dim_team t ON t.team_id = fas.team_id
    WHERE fas.season_id = ?
    ORDER BY fas.selection_team, fas.is_starter DESC, p.full_name`,
    [seasonId],
    60_000
  ) as Array<{
    bref_id: string;
    full_name: string;
    team_abbrev: string | null;
    team_name: string;
    is_starter: number;
    is_replacement: number;
  }>;

  // Group by team
  const teamsMap = new Map<string, typeof players>();
  for (const player of players) {
    const teamName = player['team_name'] || 'Team';
    if (!teamsMap.has(teamName)) {
      teamsMap.set(teamName, []);
    }
    teamsMap.get(teamName)!.push(player);
  }

  const teams = Array.from(teamsMap.entries()).map(([team_name, players]) => ({
    team_name,
    players: players.map(p => ({
      bref_id: p['bref_id'],
      full_name: p['full_name'],
      team_abbrev: p['team_abbrev'],
      is_starter: p['is_starter'],
      is_replacement: p['is_replacement'],
    })),
  }));

  return { teams };
}

/**
 * Get All-Star MVP for a specific season (from awards table).
 */
export function getAllStarMVP(seasonId: string): Record<string, string | number | null> | undefined {
  return getCachedQueryOne(
    `SELECT 
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev
    FROM fact_player_award pa
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = pa.player_id 
      AND ps.season_id = pa.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.season_id = ?
      AND pa.award_name LIKE '%All-Star%MVP%'
    LIMIT 1`,
    [seasonId],
    60_000
  ) as Record<string, string | number | null> | undefined;
}

/**
 * Get all-time All-Star MVPs.
 */
export function getAllStarMVPs(): Array<Record<string, string | number | null>> {
  return getCachedQueryMany(
    `SELECT 
      pa.season_id,
      s.start_year,
      s.end_year,
      p.bref_id,
      p.full_name,
      t.bref_abbrev as team_abbrev
    FROM fact_player_award pa
    JOIN dim_season s ON s.season_id = pa.season_id
    JOIN dim_player p ON p.bref_id = pa.player_id
    LEFT JOIN fact_player_season_stats ps ON ps.bref_player_id = pa.player_id 
      AND ps.season_id = pa.season_id
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.award_name LIKE '%All-Star%MVP%'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  ) as Array<Record<string, string | number | null>>;
}

/**
 * Get All-Star selections count for a player.
 */
export function getPlayerAllStarSelections(playerId: string): Array<{
  season_id: string;
  selection_team: string;
  is_starter: number;
}> {
  return getCachedQueryMany(
    `SELECT 
      season_id,
      selection_team,
      is_starter
    FROM fact_all_star
    WHERE player_id = ?
    ORDER BY season_id DESC`,
    [playerId],
    60_000
  ) as Array<{ season_id: string; selection_team: string; is_starter: number }>;
}
