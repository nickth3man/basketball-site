/**
 * @fileoverview Team data queries - retrieves team information, rosters, and statistics.
 * 
 * This module provides query functions for team data:
 * - Basic team information (name, city, conference, division)
 * - Current roster with player stats
 * - Season-by-season team statistics
 * - Recent game results
 * - Four Factors comparison (team vs opponent)
 * - Per-game averages and player leaders
 * - Season navigation (prev/next season)
 * 
 * All queries use the cached database layer (30s TTL) for performance.
 * 
 * @module @/lib/queries/teams
 */

import { getDb, getLatestSeasonId } from "@/lib/db";

/**
 * Retrieves team information by abbreviation.
 * 
 * Matches against either the standard abbreviation (e.g., "LAL") or
 * the Basketball-Reference abbreviation.
 * 
 * @param abbrev - Team abbreviation (e.g., "LAL", "NYK")
 * @returns Team record or undefined if not found
 */
export function getTeamByAbbrev(abbrev: string) {
  return getDb()
    .prepare(
      `SELECT team_id, abbreviation, full_name, city, nickname,
              conference, division, arena_name, founded_year
       FROM dim_team
       WHERE abbreviation = ? OR bref_abbrev = ?`,
    )
    .get(abbrev, abbrev) as
    | {
        team_id: string;
        abbreviation: string;
        full_name: string;
        city: string;
        nickname: string;
        conference: string | null;
        division: string | null;
        arena_name: string | null;
        founded_year: number | null;
      }
    | undefined;
}

/**
 * Retrieves the current roster for a team.
 * 
 * Uses the most recent season with roster data. If no roster exists,
 * falls back to the latest season ID from the database.
 * 
 * @param teamId - Internal team ID
 * @returns Array of player records on the team's roster
 */
export function getTeamRoster(teamId: string) {
  const latestRosterSeason = getDb()
    .prepare(
      `SELECT season_id
       FROM fact_roster
       WHERE team_id = ?
       ORDER BY season_id DESC
       LIMIT 1`,
    )
    .get(teamId) as { season_id: string } | undefined;
  const seasonId = latestRosterSeason?.season_id ?? getLatestSeasonId();

  return getDb()
    .prepare(
      `SELECT p.bref_id, p.full_name, p.position, p.height_cm, p.weight_kg, p.birth_date
       FROM fact_roster r
       JOIN dim_player p ON p.player_id = r.player_id
       WHERE r.team_id = ? AND r.season_id = ?
       ORDER BY p.last_name ASC`,
    )
    .all(teamId, seasonId) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieves the current roster with per-game statistics.
 * 
 * Joins roster data with player season stats for the same season.
 * Players are sorted by points per game (descending) to highlight
 * top contributors.
 * 
 * @param teamId - Internal team ID
 * @returns Array of roster records with stats
 */
export function getTeamRosterWithStats(teamId: string) {
  const latestRosterSeason = getDb()
    .prepare(
      `SELECT season_id
       FROM fact_roster
       WHERE team_id = ?
       ORDER BY season_id DESC
       LIMIT 1`,
    )
    .get(teamId) as { season_id: string } | undefined;
  const seasonId = latestRosterSeason?.season_id ?? getLatestSeasonId();

  return getDb()
    .prepare(
      `SELECT p.bref_id,
              p.full_name,
              p.position,
              p.height_cm,
              p.weight_kg,
              p.birth_date,
              fs.g,
              CASE WHEN fs.g > 0 THEN ROUND(1.0 * fs.pts / fs.g, 1) END AS pts_pg,
              CASE WHEN fs.g > 0 THEN ROUND(1.0 * fs.reb / fs.g, 1) END AS reb_pg,
              CASE WHEN fs.g > 0 THEN ROUND(1.0 * fs.ast / fs.g, 1) END AS ast_pg
       FROM fact_roster r
       JOIN dim_player p ON p.player_id = r.player_id
       LEFT JOIN fact_player_season_stats fs
         ON fs.bref_player_id = p.bref_id
        AND fs.season_id = r.season_id
        AND fs.team_abbrev IN (SELECT abbreviation FROM dim_team WHERE team_id = r.team_id)
       WHERE r.team_id = ? AND r.season_id = ?
       ORDER BY COALESCE(pts_pg, -999) DESC, p.last_name ASC`,
    )
    .all(teamId, seasonId) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieves Four Factors comparison for the team's most recent season.
 * 
 * The Four Factors are key metrics for team success:
 * - eFG%: Effective Field Goal% (accounts for 3P value)
 * - TOV%: Turnover Rate (possessions ending in TO)
 * - ORB%: Offensive Rebound% (possessions extended)
 * - FT/FGA: Free Throw Rate (getting to the line)
 * 
 * Returns both team and opponent values for comparison.
 * 
 * @param teamAbbrev - Team abbreviation (e.g., "LAL")
 * @returns Four factors record or undefined
 */
export function getTeamFourFactorsComparison(teamAbbrev: string) {
  return getDb()
    .prepare(
      `SELECT season_id,
              e_fg_pct,
              tov_pct,
              orb_pct,
              ft_fga,
              opp_e_fg_pct,
              opp_tov_pct,
              drb_pct,
              opp_ft_fga
       FROM fact_team_season
       WHERE bref_abbrev = ?
       ORDER BY season_id DESC
       LIMIT 1`,
    )
    .get(teamAbbrev) as Record<string, string | number | null> | undefined;
}

/**
 * Retrieves season-by-season statistics for a team.
 * 
 * Returns the most recent 20 seasons of team data including:
 * - Win/loss record
 * - Margin of victory
 * - Offensive/defensive/net ratings
 * - Pace and efficiency metrics
 * 
 * @param teamAbbrev - Team abbreviation (e.g., "LAL")
 * @returns Array of season records, ordered by season (newest first)
 */
export function getTeamSeasonStats(teamAbbrev: string) {
  return getDb()
    .prepare(
      `SELECT season_id, w, l, mov, o_rtg, d_rtg, n_rtg, pace,
              ts_pct, e_fg_pct, tov_pct
       FROM fact_team_season
       WHERE bref_abbrev = ?
       ORDER BY season_id DESC
       LIMIT 20`,
    )
    .all(teamAbbrev) as Array<Record<string, string | number | null>>;
}

/**
 * Finds the previous and next seasons relative to a given season.
 * 
 * Used for season navigation links on team detail pages.
 * 
 * @param teamAbbrev - Team abbreviation (e.g., "LAL")
 * @param seasonId - Season ID to find neighbors for (e.g., "2024-25")
 * @returns Object with prev/next season IDs or null
 */
export function getTeamSeasonNeighbors(teamAbbrev: string, seasonId: string) {
  const seasons = getDb()
    .prepare(
      `SELECT DISTINCT season_id
       FROM fact_team_season
       WHERE bref_abbrev = ?
       ORDER BY season_id DESC`,
    )
    .all(teamAbbrev) as Array<{ season_id: string }>;

  const idx = seasons.findIndex((s) => s.season_id === seasonId);
  return {
    prev:
      idx >= 0 && idx + 1 < seasons.length ? seasons[idx + 1].season_id : null,
    next: idx > 0 ? seasons[idx - 1].season_id : null,
  };
}

/**
 * Retrieves the current season summary for a team.
 * 
 * Returns the most recent season's record with arena and attendance info.
 * 
 * @param teamAbbrev - Team abbreviation (e.g., "LAL")
 * @returns Season summary record or undefined
 */
export function getTeamCurrentSeasonSummary(teamAbbrev: string) {
  return getDb()
    .prepare(
      `SELECT season_id, w, l, mov, srs, o_rtg, d_rtg, n_rtg, pace,
              ts_pct, e_fg_pct, tov_pct, arena, attend, attend_g
       FROM fact_team_season
       WHERE bref_abbrev = ?
       ORDER BY season_id DESC
       LIMIT 1`,
    )
    .get(teamAbbrev) as Record<string, string | number | null> | undefined;
}

/**
 * Retrieves recent completed games for a team.
 * 
 * Calculates win/loss result and scores from the team's perspective
 * (team_score = this team's score, opp_score = opponent's score).
 * Handles both home and away games.
 * 
 * @param teamId - Internal team ID
 * @param limit - Maximum number of games to return (default: 20)
 * @returns Array of game records with result, ordered by date (newest first)
 */
export function getTeamRecentGames(teamId: string, limit = 20) {
  return getDb()
    .prepare(
      `SELECT g.game_id, g.game_date,
              -- 1 if this team was home, 0 if away (for display purposes)
              CASE WHEN g.home_team_id = ? THEN 1 ELSE 0 END AS is_home,
              -- Team abbreviation (changes based on home/away)
              CASE WHEN g.home_team_id = ? THEN ht.abbreviation ELSE at.abbreviation END AS team_abbrev,
              -- Opponent abbreviation
              CASE WHEN g.home_team_id = ? THEN at.abbreviation ELSE ht.abbreviation END AS opp_abbrev,
              -- This team's score
              CASE WHEN g.home_team_id = ? THEN g.home_score ELSE g.away_score END AS team_score,
              -- Opponent's score
              CASE WHEN g.home_team_id = ? THEN g.away_score ELSE g.home_score END AS opp_score,
              -- Calculate W/L from this team's perspective
              CASE
                WHEN (CASE WHEN g.home_team_id = ? THEN g.home_score ELSE g.away_score END) >
                     (CASE WHEN g.home_team_id = ? THEN g.away_score ELSE g.home_score END)
                THEN 'W'
                WHEN (CASE WHEN g.home_team_id = ? THEN g.home_score ELSE g.away_score END) <
                     (CASE WHEN g.home_team_id = ? THEN g.away_score ELSE g.home_score END)
                THEN 'L'
                ELSE 'T'
              END AS result
       FROM fact_game g
       JOIN dim_team ht ON ht.team_id = g.home_team_id
       JOIN dim_team at ON at.team_id = g.away_team_id
       WHERE (g.home_team_id = ? OR g.away_team_id = ?)
         AND g.home_score IS NOT NULL
         AND g.away_score IS NOT NULL
       ORDER BY g.game_date DESC
       LIMIT ?`,
    )
    .all(
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      teamId,
      limit,
    ) as Array<Record<string, string | number | null>>;
}

/**
 * Retrieves per-game averages for a team's most recent season.
 * 
 * Calculates averages from team_game_log entries joined to fact_game
 * for the latest season with game data.
 * 
 * @param teamId - Internal team ID
 * @returns Per-game averages record or undefined
 */
export function getTeamPerGameAverages(teamId: string) {
  const latestGameSeason = getDb()
    .prepare(
      `SELECT fg.season_id
       FROM fact_game fg
       WHERE fg.home_team_id = ? OR fg.away_team_id = ?
       ORDER BY fg.game_date DESC
       LIMIT 1`,
    )
    .get(teamId, teamId) as { season_id: string } | undefined;

  const seasonId = latestGameSeason?.season_id;
  if (!seasonId) return undefined;

  return getDb()
    .prepare(
      `SELECT
          ROUND(AVG(tgl.pts), 1) AS pts,
          ROUND(AVG(tgl.reb), 1) AS reb,
          ROUND(AVG(tgl.ast), 1) AS ast,
          ROUND(AVG(tgl.stl), 1) AS stl,
          ROUND(AVG(tgl.blk), 1) AS blk,
          ROUND(AVG(tgl.tov), 1) AS tov,
          ROUND(AVG(tgl.fg3m), 1) AS fg3m,
          ROUND(AVG(tgl.fg3a), 1) AS fg3a,
          ROUND(AVG(CASE WHEN tgl.fga > 0 THEN 1.0 * tgl.fgm / tgl.fga END), 3) AS fg_pct,
          ROUND(AVG(CASE WHEN tgl.fta > 0 THEN 1.0 * tgl.ftm / tgl.fta END), 3) AS ft_pct
       FROM team_game_log tgl
       JOIN fact_game fg ON fg.game_id = tgl.game_id
       WHERE tgl.team_id = ? AND fg.season_id = ?`,
    )
    .get(teamId, seasonId) as Record<string, number | null>;
}

/**
 * Retrieves player statistical leaders for a team.
 * 
 * Returns top players by points per game for the team's most recent
 * season with game data. Players must have played at least 10 games
 * to qualify (prevents small-sample outliers).
 * 
 * @param teamId - Internal team ID
 * @param limit - Maximum number of leaders to return (default: 8)
 * @returns Array of player leader records
 */
export function getTeamPlayerLeaders(teamId: string, limit = 8) {
  const latestGameSeason = getDb()
    .prepare(
      `SELECT fg.season_id
       FROM fact_game fg
       WHERE fg.home_team_id = ? OR fg.away_team_id = ?
       ORDER BY fg.game_date DESC
       LIMIT 1`,
    )
    .get(teamId, teamId) as { season_id: string } | undefined;

  const seasonId = latestGameSeason?.season_id;
  if (!seasonId) return [];

  return getDb()
    .prepare(
      `SELECT dp.bref_id, dp.full_name,
              COUNT(*) AS g,
              SUM(pgl.pts) AS pts,
              SUM(pgl.reb) AS reb,
              SUM(pgl.ast) AS ast,
              ROUND(1.0 * SUM(pgl.pts) / COUNT(*), 1) AS pts_pg,
              ROUND(1.0 * SUM(pgl.reb) / COUNT(*), 1) AS reb_pg,
              ROUND(1.0 * SUM(pgl.ast) / COUNT(*), 1) AS ast_pg
       FROM player_game_log pgl
       JOIN fact_game fg ON fg.game_id = pgl.game_id
       JOIN dim_player dp ON dp.player_id = pgl.player_id
       WHERE pgl.team_id = ?
         AND fg.season_id = ?
       GROUP BY dp.player_id
       HAVING COUNT(*) >= 10  -- Minimum games threshold
       ORDER BY pts_pg DESC
       LIMIT ?`,
    )
    .all(teamId, seasonId, limit) as Array<
    Record<string, string | number | null>
  >;
}
