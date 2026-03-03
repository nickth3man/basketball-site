import { getDb } from "@/lib/db";

export function getGameById(gameId: string) {
  return getDb()
    .prepare(
      `SELECT g.game_id, g.game_date, g.season_type, g.status,
              g.home_score, g.away_score,
              ht.abbreviation as home_abbrev, ht.full_name as home_name,
              at.abbreviation as away_abbrev, at.full_name as away_name
       FROM fact_game g
       JOIN dim_team ht ON ht.team_id = g.home_team_id
       JOIN dim_team at ON at.team_id = g.away_team_id
       WHERE g.game_id = ?`,
    )
    .get(gameId) as Record<string, string | number | null> | undefined;
}

export function getGamePbpEvents(gameId: string, limit = 40) {
  return getDb()
    .prepare(
      `SELECT period, pc_time_string, home_description, visitor_description, score
       FROM fact_play_by_play
       WHERE game_id = ?
         AND (home_description IS NOT NULL OR visitor_description IS NOT NULL)
       ORDER BY period DESC, pc_time_string DESC
       LIMIT ?`,
    )
    .all(gameId, limit) as Array<Record<string, string | number | null>>;
}

export function getGamePlayerBox(gameId: string) {
  return getDb()
    .prepare(
      `SELECT t.abbreviation as team,
              p.bref_id,
              p.full_name,
              pgl.starter,
              pgl.minutes_played,
              pgl.fgm,
              pgl.fga,
              pgl.fg3m,
              pgl.fg3a,
              pgl.ftm,
              pgl.fta,
              pgl.oreb,
              pgl.dreb,
              pgl.reb,
              pgl.ast,
              pgl.stl,
              pgl.blk,
              pgl.tov,
              pgl.pf,
              pgl.pts,
              pgl.plus_minus
       FROM player_game_log pgl
       JOIN dim_player p ON p.player_id = pgl.player_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       WHERE pgl.game_id = ?
       ORDER BY t.abbreviation ASC, pgl.starter DESC, pgl.minutes_played DESC`,
    )
    .all(gameId) as Array<Record<string, string | number | null>>;
}

export function getGamePlayerAdvancedBox(gameId: string) {
  return getDb()
    .prepare(
      `SELECT t.abbreviation as team,
              p.bref_id,
              p.full_name,
              pgl.minutes_played,
              CASE WHEN pgl.fga > 0 THEN ROUND(1.0 * (pgl.fgm + 0.5 * pgl.fg3m) / pgl.fga, 3) END AS efg_pct,
              CASE WHEN (pgl.fga + 0.44 * pgl.fta) > 0 THEN ROUND(1.0 * pgl.pts / (2 * (pgl.fga + 0.44 * pgl.fta)), 3) END AS ts_pct,
              CASE WHEN (pgl.fga + 0.44 * pgl.fta + pgl.tov) > 0 THEN ROUND(100.0 * pgl.tov / (pgl.fga + 0.44 * pgl.fta + pgl.tov), 1) END AS tov_pct,
              ROUND(
                pgl.pts +
                0.4 * pgl.fgm -
                0.7 * pgl.fga -
                0.4 * (pgl.fta - pgl.ftm) +
                0.7 * pgl.oreb +
                0.3 * pgl.dreb +
                pgl.stl +
                0.7 * pgl.ast +
                0.7 * pgl.blk -
                0.4 * pgl.pf -
                pgl.tov,
                1
              ) AS game_score
       FROM player_game_log pgl
       JOIN dim_player p ON p.player_id = pgl.player_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       WHERE pgl.game_id = ?
       ORDER BY t.abbreviation ASC, game_score DESC`,
    )
    .all(gameId) as Array<Record<string, string | number | null>>;
}

export function getGameTeamFourFactors(gameId: string) {
  const rows = getDb()
    .prepare(
      `SELECT t.abbreviation as team,
              tgl.fgm,
              tgl.fga,
              tgl.fg3m,
              tgl.ftm,
              tgl.fta,
              tgl.oreb,
              tgl.dreb,
              tgl.tov,
              opp.oreb as opp_oreb,
              opp.dreb as opp_dreb
       FROM team_game_log tgl
       JOIN dim_team t ON t.team_id = tgl.team_id
       JOIN team_game_log opp ON opp.game_id = tgl.game_id AND opp.team_id <> tgl.team_id
       WHERE tgl.game_id = ?
       ORDER BY t.abbreviation ASC`,
    )
    .all(gameId) as Array<Record<string, number | string | null>>;

  return rows.map((r) => {
    const fgm = Number(r.fgm ?? 0);
    const fga = Number(r.fga ?? 0);
    const fg3m = Number(r.fg3m ?? 0);
    const ftm = Number(r.ftm ?? 0);
    const fta = Number(r.fta ?? 0);
    const oreb = Number(r.oreb ?? 0);
    const dreb = Number(r.dreb ?? 0);
    const tov = Number(r.tov ?? 0);
    const oppOreb = Number(r.opp_oreb ?? 0);
    const oppDreb = Number(r.opp_dreb ?? 0);
    const possessions = fga + 0.44 * fta + tov;
    return {
      team: r.team,
      efg_pct: fga > 0 ? Number(((fgm + 0.5 * fg3m) / fga).toFixed(3)) : null,
      tov_pct:
        possessions > 0 ? Number(((100 * tov) / possessions).toFixed(1)) : null,
      orb_pct:
        oreb + oppDreb > 0
          ? Number(((100 * oreb) / (oreb + oppDreb)).toFixed(1))
          : null,
      ft_fga: fga > 0 ? Number((ftm / fga).toFixed(3)) : null,
      drb_pct:
        dreb + oppOreb > 0
          ? Number(((100 * dreb) / (dreb + oppOreb)).toFixed(1))
          : null,
    };
  });
}

export function getGameLineScore(gameId: string) {
  const rows = getDb()
    .prepare(
      `SELECT period, score
       FROM fact_play_by_play
       WHERE game_id = ?
         AND score IS NOT NULL
       ORDER BY period ASC, event_id ASC`,
    )
    .all(gameId) as Array<{ period: number; score: string }>;
  const byPeriod = new Map<number, { away: number; home: number }>();
  let prevAway = 0;
  let prevHome = 0;
  for (const row of rows) {
    const parts = row.score.split("-");
    if (parts.length !== 2) continue;
    const away = Number(parts[0]);
    const home = Number(parts[1]);
    if (Number.isNaN(away) || Number.isNaN(home)) continue;
    byPeriod.set(row.period, {
      away: away - prevAway,
      home: home - prevHome,
    });
    prevAway = away;
    prevHome = home;
  }
  return Array.from(byPeriod.entries())
    .map(([period, scores]) => ({ period, ...scores }))
    .sort((a, b) => a.period - b.period);
}

export function getTeamGameBox(gameId: string) {
  return getDb()
    .prepare(
      `SELECT t.abbreviation as team, tgl.fgm, tgl.fga, tgl.fg3m, tgl.fg3a,
              tgl.ftm, tgl.fta, tgl.reb, tgl.ast, tgl.stl, tgl.blk, tgl.tov,
              tgl.pf, tgl.pts
       FROM team_game_log tgl
       JOIN dim_team t ON t.team_id = tgl.team_id
       WHERE tgl.game_id = ?
       ORDER BY t.abbreviation`,
    )
    .all(gameId) as Array<Record<string, string | number | null>>;
}
