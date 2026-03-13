/**
 * @fileoverview All-Star data queries - retrieves All-Star game rosters and history.
 *
 * @module @/lib/queries/allstar
 */

import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';

export interface AllStarSeasonRow {
  season_id: string;
  start_year: number;
  end_year: number;
  player_count: number;
}

export interface AllStarRosterPlayer {
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
  is_starter: number;
  is_replacement: number;
}

interface AllStarRosterQueryRow extends AllStarRosterPlayer {
  team_name: string | null;
}

export interface AllStarMvpRow {
  bref_id: string;
  full_name: string;
  team_abbrev: string | null;
}

export interface AllStarMvpHistoryRow extends AllStarMvpRow {
  season_id: string;
  start_year: number;
  end_year: number;
}

export interface PlayerAllStarSelectionRow {
  season_id: string;
  selection_team: string;
  is_starter: number;
}

/**
 * Get all seasons that have All-Star games.
 */
export function getAllStarSeasons(): AllStarSeasonRow[] {
  return getCachedQueryMany<AllStarSeasonRow[]>(
    `SELECT 
      s.season_id,
      s.start_year,
      s.end_year,
      COUNT(DISTINCT fas.player_id) as player_count
    FROM fact_all_star fas
    JOIN dim_season s ON s.season_id = fas.season_id
    WHERE EXISTS (
      SELECT 1
      FROM fact_team_season ts
      WHERE ts.season_id = fas.season_id
        AND (ts.lg = 'NBA' OR ts.lg IS NULL)
    )
    GROUP BY s.season_id, s.start_year, s.end_year
    ORDER BY s.start_year DESC`,
    [],
    60_000
  );
}

/**
 * Get All-Star rosters for a specific season.
 */
export function getAllStarRosters(seasonId: string): {
  teams: Array<{
    team_name: string;
    players: AllStarRosterPlayer[];
  }>;
} {
  const players = getCachedQueryMany<AllStarRosterQueryRow[]>(
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
      AND EXISTS (
        SELECT 1
        FROM fact_team_season ts
        WHERE ts.season_id = fas.season_id
          AND (ts.lg = 'NBA' OR ts.lg IS NULL)
      )
    ORDER BY fas.selection_team, fas.is_starter DESC, p.full_name`,
    [seasonId],
    60_000
  );

  // Group by team
  const teamsMap = new Map<string, AllStarRosterPlayer[]>();
  for (const player of players) {
    const teamName = player.team_name ?? 'Team';
    const teamPlayers = teamsMap.get(teamName);
    const normalizedPlayer: AllStarRosterPlayer = {
      bref_id: player.bref_id,
      full_name: player.full_name,
      team_abbrev: player.team_abbrev,
      is_starter: player.is_starter,
      is_replacement: player.is_replacement,
    };

    if (teamPlayers == null) {
      teamsMap.set(teamName, [normalizedPlayer]);
    } else {
      teamPlayers.push(normalizedPlayer);
    }
  }

  const teams = Array.from(teamsMap.entries()).map(([teamName, teamPlayers]) => ({
    team_name: teamName,
    players: teamPlayers,
  }));

  return { teams };
}

/**
 * Get All-Star MVP for a specific season (from awards table).
 */
export function getAllStarMVP(seasonId: string): AllStarMvpRow | undefined {
  return getCachedQueryOne<AllStarMvpRow | undefined>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LIMIT 1`,
    [seasonId],
    60_000
  );
}

/**
 * Get all-time All-Star MVPs.
 */
export function getAllStarMVPs(): AllStarMvpHistoryRow[] {
  return getCachedQueryMany<AllStarMvpHistoryRow[]>(
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
      AND (ps.lg = 'NBA' OR ps.lg IS NULL)
    LEFT JOIN dim_team t ON t.bref_abbrev = ps.team_abbrev
    WHERE pa.award_name LIKE '%All-Star%MVP%'
    ORDER BY s.start_year DESC`,
    [],
    60_000
  );
}

/**
 * Get All-Star selections count for a player.
 */
export function getPlayerAllStarSelections(playerId: string): PlayerAllStarSelectionRow[] {
  return getCachedQueryMany<PlayerAllStarSelectionRow[]>(
    `SELECT 
      season_id,
      selection_team,
      is_starter
    FROM fact_all_star
    WHERE player_id = ?
      AND EXISTS (
        SELECT 1
        FROM fact_team_season ts
        WHERE ts.season_id = fact_all_star.season_id
          AND (ts.lg = 'NBA' OR ts.lg IS NULL)
      )
    ORDER BY season_id DESC`,
    [playerId],
    60_000
  );
}
