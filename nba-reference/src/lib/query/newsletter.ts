/**
 * @fileoverview Newsletter content queries — aggregates NBA data for daily
 * email digest generation.
 *
 * Queries the read-only NBA stats database to provide:
 * - Yesterday's (or most recent) completed game results
 * - Top individual scorers from those games
 * - Standout statistical lines (triple-doubles, 40+ points, etc.)
 *
 * @module @/lib/query/newsletter
 */

import { getCachedQueryMany } from '@/lib/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single game result suitable for newsletter recap rendering.
 */
export interface NewsletterGameResult {
  game_id: string;
  game_date: string;
  home_abbrev: string;
  away_abbrev: string;
  home_score: number;
  away_score: number;
}

/**
 * A top-scoring player line from recent games.
 */
export interface NewsletterTopPerformer {
  player_name: string;
  bref_id: string;
  team_abbrev: string;
  pts: number;
  reb: number;
  ast: number;
  game_date: string;
  game_id: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Retrieve completed game results for the given date range.
 *
 * Defaults to the most recent 7 days so the newsletter always has content
 * even if there were no games exactly yesterday.
 *
 * @param fromDate - ISO date string (YYYY-MM-DD) — only games on or after this date are returned
 * @param limit     - Maximum number of games to return
 */
export function getRecentCompletedGames(fromDate: string, limit = 20): NewsletterGameResult[] {
  return getCachedQueryMany<NewsletterGameResult[]>(
    `SELECT g.game_id,
            g.game_date,
            ht.abbreviation AS home_abbrev,
            at.abbreviation AS away_abbrev,
            g.home_score,
            g.away_score
       FROM fact_game g
       JOIN dim_team ht ON ht.team_id = g.home_team_id
       JOIN dim_team at ON at.team_id = g.away_team_id
      WHERE g.home_score IS NOT NULL
        AND g.away_score IS NOT NULL
        AND g.game_date >= ?
      ORDER BY g.game_date DESC, g.game_id DESC
      LIMIT ?`,
    [fromDate, limit],
    60_000
  );
}

/**
 * Retrieve the top individual scoring performances from games played on or
 * after `fromDate`.
 *
 * Returns one row per player-game, sorted by points descending.
 *
 * @param fromDate - ISO date string (YYYY-MM-DD)
 * @param limit     - Maximum number of top-performer rows to return
 */
export function getTopPerformers(fromDate: string, limit = 10): NewsletterTopPerformer[] {
  return getCachedQueryMany<NewsletterTopPerformer[]>(
    `SELECT dp.full_name   AS player_name,
            dp.bref_id,
            dt.abbreviation AS team_abbrev,
            pgl.pts,
            pgl.reb,
            pgl.ast,
            fg.game_date,
            fg.game_id
       FROM player_game_log pgl
       JOIN dim_player dp  ON dp.player_id  = pgl.player_id
       JOIN dim_team   dt  ON dt.team_id    = pgl.team_id
       JOIN fact_game  fg  ON fg.game_id    = pgl.game_id
      WHERE fg.home_score IS NOT NULL
        AND fg.away_score IS NOT NULL
        AND fg.game_date  >= ?
        AND pgl.pts       IS NOT NULL
      ORDER BY pgl.pts DESC, pgl.reb DESC
      LIMIT ?`,
    [fromDate, limit],
    60_000
  );
}

/**
 * Compute a "since date" string that is `daysBack` days before today.
 *
 * @param daysBack - Number of days to look back (default: 1)
 */
export function sinceDate(daysBack = 1): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().slice(0, 10);
}
