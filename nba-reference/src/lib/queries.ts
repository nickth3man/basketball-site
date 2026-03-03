import { getDb, getLatestSeasonId } from "@/lib/db";
import { getHomeStandings, getRecentGames } from "@/lib/query/home";
import { searchEntities } from "@/lib/query/search";
import { getPlayerDirectory, getTeamDirectory } from "@/lib/query/directory";

export { getHomeStandings, getRecentGames, searchEntities, getPlayerDirectory, getTeamDirectory };

export function getPlayerByBrefId(brefId: string) {
  return getDb()
    .prepare(
      `SELECT player_id, bref_id, full_name, first_name, last_name,
              COALESCE(
                position,
                (
                  SELECT fps.pos
                  FROM fact_player_season_stats fps
                  WHERE fps.bref_player_id = dim_player.bref_id
                    AND fps.pos IS NOT NULL
                    AND fps.pos <> ''
                  ORDER BY fps.season_id DESC
                  LIMIT 1
                )
              ) AS position,
              height_cm, weight_kg, birth_date, birth_city, birth_country,
              college, draft_year, draft_round, draft_number, is_active, hof
       FROM dim_player
       WHERE bref_id = ?`,
    )
    .get(brefId) as
    | {
        player_id: string;
        bref_id: string;
        full_name: string;
        first_name: string;
        last_name: string;
        position: string | null;
        height_cm: number | null;
        weight_kg: number | null;
        birth_date: string | null;
        birth_city: string | null;
        birth_country: string | null;
        college: string | null;
        draft_year: number | null;
        draft_round: number | null;
        draft_number: number | null;
        is_active: number;
        hof: number;
      }
    | undefined;
}

export function getPlayerSeasonStats(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g, gs, mp, fg, fga, x3p, x3pa,
              ft, fta, reb, ast, stl, blk, tov, pf, pts
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerPer36Stats(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, g, mp,
              CASE WHEN mp > 0 THEN ROUND(1.0 * pts * 36 / mp, 1) END AS pts_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * reb * 36 / mp, 1) END AS reb_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * ast * 36 / mp, 1) END AS ast_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * stl * 36 / mp, 1) END AS stl_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * blk * 36 / mp, 1) END AS blk_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * tov * 36 / mp, 1) END AS tov_36,
              CASE WHEN mp > 0 THEN ROUND(1.0 * pf * 36 / mp, 1) END AS pf_36
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerPer100Stats(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT pss.season_id, pss.team_abbrev, pss.g,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.pts * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS pts_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.reb * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS reb_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.ast * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS ast_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.stl * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS stl_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.blk * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS blk_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.tov * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS tov_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.fg * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS fg_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.fga * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS fga_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.x3p * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS x3p_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.x3pa * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS x3pa_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.ft * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS ft_100,
              CASE WHEN pss.mp > 0 THEN ROUND(1.0 * pss.fta * 4800 / (pss.mp * COALESCE(fts.pace, 100)), 1) END AS fta_100
       FROM fact_player_season_stats pss
       LEFT JOIN fact_team_season fts
         ON fts.season_id = pss.season_id
        AND fts.bref_abbrev = pss.team_abbrev
       WHERE pss.bref_player_id = ?
       ORDER BY pss.season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerPerGameStats(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g, gs,
              CASE WHEN g > 0 THEN ROUND(1.0 * mp / g, 1) END AS mp_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * pts / g, 1) END AS pts_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * reb / g, 1) END AS reb_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * ast / g, 1) END AS ast_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * stl / g, 1) END AS stl_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * blk / g, 1) END AS blk_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * tov / g, 1) END AS tov_pg,
              CASE WHEN g > 0 THEN ROUND(1.0 * pf / g, 1) END AS pf_pg,
              CASE WHEN fga > 0 THEN ROUND(1.0 * fg / fga, 3) END AS fg_pct,
              CASE WHEN x3pa > 0 THEN ROUND(1.0 * x3p / x3pa, 3) END AS fg3_pct,
              CASE WHEN fta > 0 THEN ROUND(1.0 * ft / fta, 3) END AS ft_pct
       FROM fact_player_season_stats
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerAdvancedSeasonStats(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, pos, age, g, mp,
              per, ts_pct, x3p_ar, f_tr,
              orb_pct, drb_pct, trb_pct, ast_pct, stl_pct, blk_pct, tov_pct,
              usg_pct, ows, dws, ws, ws_48, obpm, dbpm, bpm, vorp
       FROM fact_player_advanced_season
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerShootingSeasonStats(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, g, mp, avg_dist_fga,
              pct_fga_0_3, pct_fga_3_10, pct_fga_10_16, pct_fga_16_3p, pct_fga_3p,
              fg_pct_0_3, fg_pct_3_10, fg_pct_10_16, fg_pct_16_3p, fg_pct_3p,
              pct_ast_2p, pct_ast_3p,
              pct_dunks_fga, num_dunks,
              pct_corner3_3pa, corner3_pct
       FROM fact_player_shooting_season
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerAdjustedShootingStats(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT pss.season_id,
              pss.team_abbrev,
              pss.g,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * pss.fg / pss.fga, 3) END AS fg_pct,
              CASE WHEN pss.x3pa > 0 THEN ROUND(1.0 * pss.x3p / pss.x3pa, 3) END AS fg3_pct,
              CASE WHEN pss.fta > 0 THEN ROUND(1.0 * pss.ft / pss.fta, 3) END AS ft_pct,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * (pss.fg + 0.5 * pss.x3p) / pss.fga, 3) END AS efg_pct,
              CASE WHEN (pss.fga + 0.44 * pss.fta) > 0 THEN ROUND(1.0 * pss.pts / (2 * (pss.fga + 0.44 * pss.fta)), 3) END AS ts_pct,
              CASE WHEN lg.avg_efg IS NOT NULL AND lg.avg_efg > 0 AND pss.fga > 0
                THEN ROUND(100.0 * ((pss.fg + 0.5 * pss.x3p) * 1.0 / pss.fga) / lg.avg_efg, 0)
              END AS efg_plus,
              CASE WHEN lg.avg_ts IS NOT NULL AND lg.avg_ts > 0 AND (pss.fga + 0.44 * pss.fta) > 0
                THEN ROUND(100.0 * (pss.pts * 1.0 / (2 * (pss.fga + 0.44 * pss.fta))) / lg.avg_ts, 0)
              END AS ts_plus,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * pss.x3pa / pss.fga, 3) END AS x3p_ar,
              CASE WHEN pss.fga > 0 THEN ROUND(1.0 * pss.fta / pss.fga, 3) END AS f_tr
       FROM fact_player_season_stats pss
       LEFT JOIN (
         SELECT season_id,
                CASE WHEN SUM(fga) > 0 THEN 1.0 * SUM(fgm + 0.5 * fg3m) / SUM(fga) END AS avg_efg,
                CASE WHEN SUM(fga + 0.44 * fta) > 0 THEN 1.0 * SUM(pts) / (2 * SUM(fga + 0.44 * fta)) END AS avg_ts
         FROM team_game_log tgl
         JOIN fact_game fg ON fg.game_id = tgl.game_id
         WHERE fg.season_type = 'Regular Season'
         GROUP BY fg.season_id
       ) lg ON lg.season_id = pss.season_id
       WHERE pss.bref_player_id = ?
       ORDER BY pss.season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerPbpSeasonStats(brefId: string, limit = 25) {
  return getDb()
    .prepare(
      `SELECT season_id, team_abbrev, g, mp,
              pg_pct, sg_pct, sf_pct, pf_pct, c_pct,
              on_court_pm_per100, net_pm_per100,
              bad_pass_tov, lost_ball_tov,
              shoot_foul_drawn, off_foul_drawn, and1
       FROM fact_player_pbp_season
       WHERE bref_player_id = ?
       ORDER BY season_id DESC
       LIMIT ?`,
    )
    .all(brefId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerRecentGames(playerId: string, limit = 20) {
  return getDb()
    .prepare(
      `SELECT pgl.game_id, g.game_date, t.abbreviation as team_abbrev,
              pgl.minutes_played, pgl.pts, pgl.reb, pgl.ast, pgl.stl, pgl.blk,
              pgl.fgm, pgl.fga, pgl.fg3m, pgl.fg3a, pgl.ftm, pgl.fta
       FROM player_game_log pgl
       JOIN fact_game g ON g.game_id = pgl.game_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       WHERE pgl.player_id = ?
       ORDER BY g.game_date DESC
       LIMIT ?`,
    )
    .all(playerId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerFullGameLog(playerId: string, limit = 100) {
  return getDb()
    .prepare(
      `SELECT pgl.game_id,
              g.game_date,
              t.abbreviation as team_abbrev,
              opp.abbreviation as opp_abbrev,
              CASE WHEN g.home_team_id = pgl.team_id THEN 1 ELSE 0 END AS is_home,
              pgl.minutes_played,
              pgl.fgm,
              pgl.fga,
              pgl.fg3m,
              pgl.fg3a,
              pgl.ftm,
              pgl.fta,
              pgl.reb,
              pgl.ast,
              pgl.stl,
              pgl.blk,
              pgl.tov,
              pgl.pf,
              pgl.pts,
              CASE
                WHEN (CASE WHEN g.home_team_id = pgl.team_id THEN g.home_score ELSE g.away_score END) >
                     (CASE WHEN g.home_team_id = pgl.team_id THEN g.away_score ELSE g.home_score END)
                THEN 'W'
                WHEN (CASE WHEN g.home_team_id = pgl.team_id THEN g.home_score ELSE g.away_score END) <
                     (CASE WHEN g.home_team_id = pgl.team_id THEN g.away_score ELSE g.home_score END)
                THEN 'L'
                ELSE 'T'
              END AS result,
              CASE WHEN g.home_team_id = pgl.team_id THEN g.home_score ELSE g.away_score END AS team_score,
              CASE WHEN g.home_team_id = pgl.team_id THEN g.away_score ELSE g.home_score END AS opp_score,
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
              ) AS gmsc,
              pgl.plus_minus
       FROM player_game_log pgl
       JOIN fact_game g ON g.game_id = pgl.game_id
       JOIN dim_team t ON t.team_id = pgl.team_id
       JOIN dim_team opp ON opp.team_id = CASE WHEN g.home_team_id = pgl.team_id THEN g.away_team_id ELSE g.home_team_id END
       WHERE pgl.player_id = ?
       ORDER BY g.game_date DESC
       LIMIT ?`,
    )
    .all(playerId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerAwards(playerId: string, limit = 100) {
  return getDb()
    .prepare(
      `SELECT season_id, award_name, award_type
       FROM fact_player_award
       WHERE player_id = ?
       ORDER BY season_id DESC, award_name ASC
       LIMIT ?`,
    )
    .all(playerId, limit) as Array<{
    season_id: string;
    award_name: string;
    award_type: string;
  }>;
}

export function getPlayerSalaries(playerId: string, limit = 50) {
  return getDb()
    .prepare(
      `SELECT fs.season_id, dt.abbreviation as team_abbrev, fs.salary
       FROM fact_salary fs
       JOIN dim_team dt ON dt.team_id = fs.team_id
       WHERE fs.player_id = ?
       ORDER BY fs.season_id DESC
       LIMIT ?`,
    )
    .all(playerId, limit) as Array<Record<string, number | string | null>>;
}

export function getPlayerCareerSummary(brefId: string) {
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
       WHERE bref_player_id = ?`,
    )
    .get(brefId) as Record<string, number | null>;
}

export function getPlayerGameHighs(playerId: string) {
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
       WHERE player_id = ?`,
    )
    .get(playerId) as Record<string, number | null>;
}

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
    prev: idx >= 0 && idx + 1 < seasons.length ? seasons[idx + 1].season_id : null,
    next: idx > 0 ? seasons[idx - 1].season_id : null,
  };
}

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

export function getTeamRecentGames(teamId: string, limit = 20) {
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
         AND g.home_score IS NOT NULL
         AND g.away_score IS NOT NULL
       ORDER BY g.game_date DESC
       LIMIT ?`,
    )
    .all(teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, limit) as Array<
    Record<string, string | number | null>
  >;
}

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
       HAVING COUNT(*) >= 10
       ORDER BY pts_pg DESC
       LIMIT ?`,
    )
    .all(teamId, seasonId, limit) as Array<Record<string, string | number | null>>;
}

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
      tov_pct: possessions > 0 ? Number((100 * tov / possessions).toFixed(1)) : null,
      orb_pct: (oreb + oppDreb) > 0 ? Number((100 * oreb / (oreb + oppDreb)).toFixed(1)) : null,
      ft_fga: fga > 0 ? Number((ftm / fga).toFixed(3)) : null,
      drb_pct: (dreb + oppOreb) > 0 ? Number((100 * dreb / (dreb + oppOreb)).toFixed(1)) : null,
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

export function getSeasons(limit = 30) {
  return getDb()
    .prepare(
      `SELECT season_id, start_year, end_year
       FROM dim_season
       ORDER BY start_year DESC
       LIMIT ?`,
    )
    .all(limit) as Array<{ season_id: string; start_year: number; end_year: number }>;
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
