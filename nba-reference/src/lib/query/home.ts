import {
  getCachedQueryMany,
  getCachedQueryOne,
  getLatestSeasonId,
} from "@/lib/db";

export type TeamStandingRow = {
  season_id: string;
  bref_abbrev: string;
  w: number | null;
  l: number | null;
  n_rtg: number | null;
  pace: number | null;
};

export type RecentGameRow = {
  game_id: string;
  game_date: string;
  home_abbrev: string;
  away_abbrev: string;
  home_score: number | null;
  away_score: number | null;
};

export function getHomeStandings(limit = 15): TeamStandingRow[] {
  const latestWithTeamData = getCachedQueryOne<
    { season_id: string } | undefined
  >(
    "SELECT season_id FROM fact_team_season ORDER BY season_id DESC LIMIT 1",
    [],
    60_000,
  );
  const seasonId = latestWithTeamData?.season_id ?? getLatestSeasonId();

  return getCachedQueryMany<TeamStandingRow[]>(
    `SELECT season_id, bref_abbrev, w, l, n_rtg, pace
     FROM fact_team_season
     WHERE season_id = ?
     ORDER BY w DESC, l ASC
     LIMIT ?`,
    [seasonId, limit],
    20_000,
  );
}

export function getRecentGames(limit = 12): RecentGameRow[] {
  return getCachedQueryMany<RecentGameRow[]>(
    `SELECT g.game_id, g.game_date,
            ht.abbreviation as home_abbrev,
            at.abbreviation as away_abbrev,
            g.home_score, g.away_score
     FROM fact_game g
     JOIN dim_team ht ON ht.team_id = g.home_team_id
     JOIN dim_team at ON at.team_id = g.away_team_id
     WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL
     ORDER BY g.game_date DESC
     LIMIT ?`,
    [limit],
    15_000,
  );
}
