import { getDb } from "@/lib/db";

export function getSeasons(limit = 30) {
  return getDb()
    .prepare(
      `SELECT season_id, start_year, end_year
       FROM dim_season
       ORDER BY start_year DESC
       LIMIT ?`,
    )
    .all(limit) as Array<{
    season_id: string;
    start_year: number;
    end_year: number;
  }>;
}

export function getSeasonStandings(seasonId: string) {
  return getDb()
    .prepare(
      `SELECT bref_abbrev, w, l, srs, o_rtg, d_rtg, n_rtg, pace
       FROM fact_team_season
       WHERE season_id = ?
       ORDER BY w DESC, l ASC`,
    )
    .all(seasonId) as Array<Record<string, string | number | null>>;
}

export function getSeasonScoringLeaders(seasonId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT p.bref_id, p.full_name, t.abbreviation as team,
              COUNT(*) as g,
              SUM(pgl.pts) as pts,
              ROUND(1.0 * SUM(pgl.pts) / COUNT(*), 1) as pts_pg
       FROM player_game_log pgl
       JOIN fact_game fg ON fg.game_id = pgl.game_id
       JOIN dim_player p ON p.player_id = pgl.player_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       WHERE fg.season_id = ?
       GROUP BY p.player_id, t.abbreviation
       HAVING COUNT(*) >= 10
       ORDER BY pts_pg DESC
       LIMIT ?`,
    )
    .all(seasonId, limit) as Array<Record<string, string | number | null>>;
}

export function getSeasonReboundLeaders(seasonId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT p.bref_id, p.full_name, t.abbreviation as team,
              COUNT(*) as g,
              SUM(pgl.reb) as reb,
              ROUND(1.0 * SUM(pgl.reb) / COUNT(*), 1) as reb_pg
       FROM player_game_log pgl
       JOIN fact_game fg ON fg.game_id = pgl.game_id
       JOIN dim_player p ON p.player_id = pgl.player_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       WHERE fg.season_id = ?
       GROUP BY p.player_id, t.abbreviation
       HAVING COUNT(*) >= 10
       ORDER BY reb_pg DESC
       LIMIT ?`,
    )
    .all(seasonId, limit) as Array<Record<string, string | number | null>>;
}

export function getSeasonAssistLeaders(seasonId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT p.bref_id, p.full_name, t.abbreviation as team,
              COUNT(*) as g,
              SUM(pgl.ast) as ast,
              ROUND(1.0 * SUM(pgl.ast) / COUNT(*), 1) as ast_pg
       FROM player_game_log pgl
       JOIN fact_game fg ON fg.game_id = pgl.game_id
       JOIN dim_player p ON p.player_id = pgl.player_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       WHERE fg.season_id = ?
       GROUP BY p.player_id, t.abbreviation
       HAVING COUNT(*) >= 10
       ORDER BY ast_pg DESC
       LIMIT ?`,
    )
    .all(seasonId, limit) as Array<Record<string, string | number | null>>;
}

export function getSeasonLeagueSummary(seasonId: string) {
  return getDb()
    .prepare(
      `SELECT ROUND(AVG(pts), 1) AS ppg,
              ROUND(AVG(reb), 1) AS rpg,
              ROUND(AVG(ast), 1) AS apg,
              ROUND(AVG(CASE WHEN fga > 0 THEN 1.0 * (fgm + 0.5 * fg3m) / fga END), 3) AS efg_pct,
              ROUND(AVG(CASE WHEN (fga + 0.44 * fta) > 0 THEN 1.0 * pts / (2 * (fga + 0.44 * fta)) END), 3) AS ts_pct
       FROM team_game_log tgl
       JOIN fact_game fg ON fg.game_id = tgl.game_id
       WHERE fg.season_id = ?`,
    )
    .get(seasonId) as Record<string, number | null>;
}

export function getSeasonRecentGames(seasonId: string, limit = 50) {
  return getDb()
    .prepare(
      `SELECT g.game_id, g.game_date,
              ht.abbreviation as home_abbrev,
              at.abbreviation as away_abbrev,
              g.home_score,
              g.away_score
       FROM fact_game g
       JOIN dim_team ht ON ht.team_id = g.home_team_id
       JOIN dim_team at ON at.team_id = g.away_team_id
       WHERE g.season_id = ?
         AND g.home_score IS NOT NULL
         AND g.away_score IS NOT NULL
       ORDER BY g.game_date DESC
       LIMIT ?`,
    )
    .all(seasonId, limit) as Array<Record<string, string | number | null>>;
}
