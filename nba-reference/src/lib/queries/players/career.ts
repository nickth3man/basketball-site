/**
 * @fileoverview Player career statistics queries - career totals, summaries, awards, salaries.
 *
 * @module @/lib/queries/players/career
 */

import { getDb } from '@/lib/db';

/**
 * Retrieves career summary statistics for a player.
 *
 * Aggregates totals across all seasons and calculates per-game averages
 * and shooting percentages.
 *
 * @param brefId - Basketball-Reference player ID
 * @returns Career totals and averages record
 *
 * @example
 * const career = getPlayerCareerSummary('jamesle01');
 * console.log(career.g);       // Total games played
 * console.log(career.pts_pg);  // Career points per game average
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
 * Retrieves career totals for a player across all seasons.
 *
 * @param brefId - Basketball-Reference player ID
 * @returns A record mapping stat names to their summed totals; values may be `null` if no data exists
 *
 * @example
 * const totals = getPlayerCareerTotals('jamesle01');
 * console.log(totals.pts); // Career total points
 * console.log(totals.g);   // Career total games
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
 * Retrieves a player's career single-game highs across major box-score categories.
 *
 * @param playerId - Internal player ID (database identifier, not Basketball-Reference ID)
 * @returns A record with single-game maximums for each stat, or `null` if no value exists
 *
 * @example
 * const highs = getPlayerGameHighs('12345');
 * console.log(highs.pts);  // Career-high points in a single game
 * console.log(highs.reb);  // Career-high rebounds in a single game
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
 * Retrieves a player's awards and honors.
 *
 * @param playerId - Internal player ID (not bref_id)
 * @param limit - Maximum number of awards to return (default: 100)
 * @returns Array of award records, ordered by season (newest first)
 *
 * @example
 * const awards = getPlayerAwards('12345');
 * awards.forEach(a => console.log(`${a.season_id}: ${a.award_name}`));
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
 *
 * @example
 * const salaries = getPlayerSalaries('12345');
 * console.log(salaries[0].salary); // Most recent season salary
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
