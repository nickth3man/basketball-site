import { getDb, getLatestSeasonId } from '@/lib/db';

export function clampPositiveLimit(limit: number, fallback: number, max: number): number {
  if (!Number.isFinite(limit)) return fallback;
  const truncatedLimit = Math.trunc(limit);
  if (truncatedLimit < 1) return 1;
  if (truncatedLimit > max) return max;
  return truncatedLimit;
}

export function getLatestRosterSeasonId(teamId: string): string {
  const latestRosterSeason = getDb()
    .prepare(
      `SELECT season_id
       FROM fact_roster
       WHERE team_id = ?
       ORDER BY season_id DESC
       LIMIT 1`
    )
    .get(teamId) as { season_id: string } | undefined;

  return latestRosterSeason?.season_id ?? getLatestSeasonId();
}

export function getLatestGameSeasonId(teamId: string): string | undefined {
  const latestGameSeason = getDb()
    .prepare(
      `SELECT fg.season_id
       FROM fact_game fg
       WHERE (fg.home_team_id = ? OR fg.away_team_id = ?)
         AND fg.home_score IS NOT NULL
         AND fg.away_score IS NOT NULL
       ORDER BY fg.game_date DESC
       LIMIT 1`
    )
    .get(teamId, teamId) as { season_id: string } | undefined;

  return latestGameSeason?.season_id;
}

export function getTeamRecentGamesForSeason(
  teamId: string,
  seasonId: string,
  limit = 20
): Array<Record<string, string | number | null>> {
  const safeLimit = clampPositiveLimit(limit, 20, 100);

  return getDb()
    .prepare(
      `SELECT g.game_id, g.game_date,
              CASE WHEN g.home_team_id = ? THEN 1 ELSE 0 END AS is_home,
              CASE WHEN g.home_team_id = ? THEN ht.abbreviation ELSE at.abbreviation END AS team_abbrev,
              CASE WHEN g.home_team_id = ? THEN at.abbreviation ELSE ht.abbreviation END AS opp_abbrev,
              CASE WHEN g.home_team_id = ? THEN g.home_score ELSE g.away_score END AS team_score,
              CASE WHEN g.home_team_id = ? THEN g.away_score ELSE g.home_score END AS opp_score,
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
          AND g.season_id = ?
          AND g.home_score IS NOT NULL
          AND g.away_score IS NOT NULL
        ORDER BY g.game_date DESC
       LIMIT ?`
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
      seasonId,
      safeLimit
    ) as Array<Record<string, string | number | null>>;
}

export function getTeamPerGameAveragesForSeason(
  teamId: string,
  seasonId: string
): Record<string, number | null> | undefined {
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
        WHERE tgl.team_id = ? AND fg.season_id = ?`
    )
    .get(teamId, seasonId) as Record<string, number | null>;
}

export function getTeamPlayerLeadersForSeason(
  teamId: string,
  seasonId: string,
  limit = 8
): Array<Record<string, string | number | null>> {
  const safeLimit = clampPositiveLimit(limit, 8, 100);

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
       HAVING COUNT(*) >= 10
       ORDER BY pts_pg DESC
       LIMIT ?`
    )
    .all(teamId, seasonId, safeLimit) as Array<Record<string, string | number | null>>;
}
