import { getDb } from '@/lib/db';

export function getDraftSeasons(limit = 40): Array<{
  season_id: string;
  start_year: number;
  end_year: number;
}> {
  return getDb()
    .prepare(
      `SELECT DISTINCT ds.season_id,
                       ds.start_year,
                       ds.end_year
       FROM fact_draft fd
       JOIN dim_season ds ON ds.season_id = fd.season_id
       ORDER BY ds.end_year DESC
       LIMIT ?`
    )
    .all(limit) as Array<{
    season_id: string;
    start_year: number;
    end_year: number;
  }>;
}

export function getDraftBySeason(seasonId: string): Array<Record<string, string | number | null>> {
  return getDb()
    .prepare(
      `SELECT fd.season_id,
              fd.draft_round,
              fd.overall_pick,
              fd.bref_team_abbrev,
              fd.bref_player_id,
              fd.player_name,
              fd.college,
              fd.lg
       FROM fact_draft fd
       WHERE fd.season_id = ?
       ORDER BY fd.overall_pick ASC`
    )
    .all(seasonId) as Array<Record<string, string | number | null>>;
}
