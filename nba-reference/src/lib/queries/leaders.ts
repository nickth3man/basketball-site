import { getDb } from '@/lib/db';

type LeaderStat = 'pts' | 'reb' | 'ast' | 'stl' | 'blk';

const leaderStatColumns: Record<LeaderStat, string> = {
  pts: 'SUM(fpss.pts)',
  reb: 'SUM(fpss.reb)',
  ast: 'SUM(fpss.ast)',
  stl: 'SUM(fpss.stl)',
  blk: 'SUM(fpss.blk)',
};

export function getLatestSeasonWithPlayerStats(): string | null {
  const row = getDb()
    .prepare(
      `SELECT season_id
       FROM fact_player_season_stats
       ORDER BY season_id DESC
       LIMIT 1`
    )
    .get() as { season_id: string } | undefined;

  return row?.season_id ?? null;
}

export function getSeasonLeadersByPerGame(
  seasonId: string,
  stat: LeaderStat,
  limit = 25,
  minimumGames = 10
): Array<Record<string, string | number | null>> {
  const statTotalSql = leaderStatColumns[stat];

  return getDb()
    .prepare(
      `SELECT p.bref_id,
              p.full_name,
              GROUP_CONCAT(DISTINCT fpss.team_abbrev) AS team,
              SUM(fpss.g) AS g,
              ${statTotalSql} AS stat_total,
              ROUND(1.0 * ${statTotalSql} / SUM(fpss.g), 1) AS stat_per_game
       FROM fact_player_season_stats fpss
       JOIN dim_player p ON p.bref_id = fpss.bref_player_id
       WHERE fpss.season_id = ?
         AND fpss.team_abbrev NOT LIKE '%TM'
       GROUP BY p.bref_id, p.full_name
       HAVING SUM(fpss.g) >= ?
       ORDER BY stat_per_game DESC, stat_total DESC
       LIMIT ?`
    )
    .all(seasonId, minimumGames, limit) as Array<Record<string, string | number | null>>;
}

export function getAllTimeLeadersByTotal(
  stat: LeaderStat,
  limit = 25,
  minimumGames = 100
): Array<Record<string, string | number | null>> {
  const statTotalSql = leaderStatColumns[stat];

  return getDb()
    .prepare(
      `SELECT p.bref_id,
              p.full_name,
              SUM(fpss.g) AS g,
              ${statTotalSql} AS stat_total,
              ROUND(1.0 * ${statTotalSql} / SUM(fpss.g), 1) AS stat_per_game
       FROM fact_player_season_stats fpss
       JOIN dim_player p ON p.bref_id = fpss.bref_player_id
       WHERE fpss.team_abbrev NOT LIKE '%TM'
       GROUP BY p.bref_id, p.full_name
       HAVING SUM(fpss.g) >= ?
       ORDER BY stat_total DESC
       LIMIT ?`
    )
    .all(minimumGames, limit) as Array<Record<string, string | number | null>>;
}
