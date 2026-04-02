import type { Route } from 'next';
import { routes } from '@/lib/routes';
import type { StatsTableColumn } from '@/components/stats-table';
import type { CareerSeasonData } from '@/lib/types/charts';

export const PLAYER_PAGE_ANCHOR_SECTIONS = [
  { id: 'per-game', label: 'Per Game' },
  { id: 'per-36', label: 'Per 36 Min' },
  { id: 'per-100', label: 'Per 100 Poss' },
  { id: 'totals', label: 'Totals' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'shooting', label: 'Shooting' },
  { id: 'adjusted-shooting', label: 'Adjusted Shooting' },
  { id: 'pbp', label: 'Play-by-Play' },
  { id: 'game-log', label: 'Game Log' },
  { id: 'awards', label: 'Awards' },
  { id: 'salaries', label: 'Salaries' },
  { id: 'highs', label: 'Game Highs' },
] as const;

export const PER_GAME_COLUMNS: StatsTableColumn[] = [
  { key: 'season_id', label: 'Season', link: { type: 'league' } },
  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
  { key: 'g', label: 'G', align: 'right' },
  { key: 'gs', label: 'GS', align: 'right' },
  { key: 'mp_pg', label: 'MP', align: 'right' },
  { key: 'pts_pg', label: 'PTS', align: 'right' },
  { key: 'reb_pg', label: 'TRB', align: 'right' },
  { key: 'ast_pg', label: 'AST', align: 'right' },
  { key: 'stl_pg', label: 'STL', align: 'right' },
  { key: 'blk_pg', label: 'BLK', align: 'right' },
  { key: 'tov_pg', label: 'TOV', align: 'right' },
  { key: 'pf_pg', label: 'PF', align: 'right' },
  { key: 'fg_pct', label: 'FG%', align: 'right' },
  { key: 'fg3_pct', label: '3P%', align: 'right' },
  { key: 'ft_pct', label: 'FT%', align: 'right' },
] as const;

export const PER_36_COLUMNS: StatsTableColumn[] = [
  { key: 'season_id', label: 'Season', link: { type: 'league' } },
  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
  { key: 'g', label: 'G', align: 'right' },
  { key: 'pts_36', label: 'PTS', align: 'right' },
  { key: 'reb_36', label: 'TRB', align: 'right' },
  { key: 'ast_36', label: 'AST', align: 'right' },
  { key: 'stl_36', label: 'STL', align: 'right' },
  { key: 'blk_36', label: 'BLK', align: 'right' },
  { key: 'tov_36', label: 'TOV', align: 'right' },
  { key: 'pf_36', label: 'PF', align: 'right' },
] as const;

export const TOTALS_COLUMNS: StatsTableColumn[] = [
  { key: 'season_id', label: 'Season', link: { type: 'league' } },
  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
  { key: 'g', label: 'G', align: 'right' },
  { key: 'gs', label: 'GS', align: 'right' },
  { key: 'mp', label: 'MP', align: 'right' },
  { key: 'pts', label: 'PTS', align: 'right' },
  { key: 'reb', label: 'TRB', align: 'right' },
  { key: 'ast', label: 'AST', align: 'right' },
  { key: 'stl', label: 'STL', align: 'right' },
  { key: 'blk', label: 'BLK', align: 'right' },
  { key: 'tov', label: 'TOV', align: 'right' },
  { key: 'pf', label: 'PF', align: 'right' },
  { key: 'fg', label: 'FG', align: 'right' },
  { key: 'fga', label: 'FGA', align: 'right' },
  { key: 'x3p', label: '3P', align: 'right' },
  { key: 'x3pa', label: '3PA', align: 'right' },
  { key: 'ft', label: 'FT', align: 'right' },
  { key: 'fta', label: 'FTA', align: 'right' },
] as const;

export const PER_100_COLUMNS: StatsTableColumn[] = [
  { key: 'season_id', label: 'Season', link: { type: 'league' } },
  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
  { key: 'g', label: 'G', align: 'right' },
  { key: 'pts_100', label: 'PTS', align: 'right' },
  { key: 'reb_100', label: 'TRB', align: 'right' },
  { key: 'ast_100', label: 'AST', align: 'right' },
  { key: 'stl_100', label: 'STL', align: 'right' },
  { key: 'blk_100', label: 'BLK', align: 'right' },
  { key: 'tov_100', label: 'TOV', align: 'right' },
  { key: 'fg_100', label: 'FG', align: 'right' },
  { key: 'fga_100', label: 'FGA', align: 'right' },
  { key: 'x3p_100', label: '3P', align: 'right' },
  { key: 'x3pa_100', label: '3PA', align: 'right' },
  { key: 'ft_100', label: 'FT', align: 'right' },
  { key: 'fta_100', label: 'FTA', align: 'right' },
] as const;

export const ADVANCED_COLUMNS: StatsTableColumn[] = [
  { key: 'season_id', label: 'Season', link: { type: 'league' } },
  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
  { key: 'g', label: 'G', align: 'right' },
  { key: 'per', label: 'PER', align: 'right' },
  { key: 'ts_pct', label: 'TS%', align: 'right' },
  { key: 'usg_pct', label: 'USG%', align: 'right' },
  { key: 'orb_pct', label: 'ORB%', align: 'right' },
  { key: 'drb_pct', label: 'DRB%', align: 'right' },
  { key: 'trb_pct', label: 'TRB%', align: 'right' },
  { key: 'ast_pct', label: 'AST%', align: 'right' },
  { key: 'stl_pct', label: 'STL%', align: 'right' },
  { key: 'blk_pct', label: 'BLK%', align: 'right' },
  { key: 'tov_pct', label: 'TOV%', align: 'right' },
  { key: 'x3p_ar', label: '3PAr', align: 'right' },
  { key: 'f_tr', label: 'FTr', align: 'right' },
  { key: 'ws', label: 'WS', align: 'right' },
  { key: 'ws_48', label: 'WS/48', align: 'right' },
  { key: 'ows', label: 'OWS', align: 'right' },
  { key: 'dws', label: 'DWS', align: 'right' },
  { key: 'obpm', label: 'OBPM', align: 'right' },
  { key: 'dbpm', label: 'DBPM', align: 'right' },
  { key: 'bpm', label: 'BPM', align: 'right' },
  { key: 'vorp', label: 'VORP', align: 'right' },
] as const;

export const SHOOTING_COLUMNS: StatsTableColumn[] = [
  { key: 'season_id', label: 'Season', link: { type: 'league' } },
  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
  { key: 'avg_dist_fga', label: 'AvgDist', align: 'right' },
  { key: 'pct_fga_0_3', label: '%0-3', align: 'right' },
  { key: 'pct_fga_3_10', label: '%3-10', align: 'right' },
  { key: 'pct_fga_10_16', label: '%10-16', align: 'right' },
  { key: 'pct_fga_16_3p', label: '%16-3P', align: 'right' },
  { key: 'pct_fga_3p', label: '%3P', align: 'right' },
  { key: 'fg_pct_0_3', label: 'FG%0-3', align: 'right' },
  { key: 'fg_pct_3_10', label: 'FG%3-10', align: 'right' },
  { key: 'fg_pct_10_16', label: 'FG%10-16', align: 'right' },
  { key: 'fg_pct_16_3p', label: 'FG%16-3P', align: 'right' },
  { key: 'pct_ast_2p', label: 'Ast 2P%', align: 'right' },
  { key: 'pct_ast_3p', label: 'Ast 3P%', align: 'right' },
  { key: 'pct_dunks_fga', label: 'DunkA%', align: 'right' },
  { key: 'pct_corner3_3pa', label: 'Corner3A%', align: 'right' },
  { key: 'corner3_pct', label: 'Corner3%', align: 'right' },
  { key: 'fg_pct_3p', label: '3P%', align: 'right' },
  { key: 'num_dunks', label: 'Dunks', align: 'right' },
] as const;

export const ADJUSTED_SHOOTING_COLUMNS: StatsTableColumn[] = [
  { key: 'season_id', label: 'Season', link: { type: 'league' } },
  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
  { key: 'g', label: 'G', align: 'right' },
  { key: 'fg_pct', label: 'FG%', align: 'right' },
  { key: 'fg3_pct', label: '3P%', align: 'right' },
  { key: 'ft_pct', label: 'FT%', align: 'right' },
  { key: 'efg_pct', label: 'eFG%', align: 'right' },
  { key: 'ts_pct', label: 'TS%', align: 'right' },
  { key: 'efg_plus', label: 'eFG+', align: 'right' },
  { key: 'ts_plus', label: 'TS+', align: 'right' },
  { key: 'x3p_ar', label: '3PAr', align: 'right' },
  { key: 'f_tr', label: 'FTr', align: 'right' },
] as const;

export const PBP_COLUMNS: StatsTableColumn[] = [
  { key: 'season_id', label: 'Season', link: { type: 'league' } },
  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
  { key: 'pg_pct', label: 'PG%', align: 'right' },
  { key: 'sg_pct', label: 'SG%', align: 'right' },
  { key: 'sf_pct', label: 'SF%', align: 'right' },
  { key: 'pf_pct', label: 'PF%', align: 'right' },
  { key: 'c_pct', label: 'C%', align: 'right' },
  { key: 'on_court_pm_per100', label: 'OnCourt/100', align: 'right' },
  { key: 'net_pm_per100', label: 'Net/100', align: 'right' },
  { key: 'bad_pass_tov', label: 'BadPassTO', align: 'right' },
  { key: 'lost_ball_tov', label: 'LostBallTO', align: 'right' },
  { key: 'shoot_foul_drawn', label: 'ShtFoulDrawn', align: 'right' },
  { key: 'off_foul_drawn', label: 'OffFoulDrawn', align: 'right' },
  { key: 'and1', label: 'And1', align: 'right' },
] as const;

export const GAME_LOG_COLUMNS: StatsTableColumn[] = [
  { key: 'game_date', label: 'Date', link: { type: 'boxscore', valueKey: 'game_id' } },
  { key: 'team_abbrev', label: 'Tm', link: { type: 'team' } },
  { key: 'opp_abbrev', label: 'Opp', link: { type: 'team' } },
  { key: 'is_home', label: 'Site' },
  { key: 'result', label: 'W/L' },
  { key: 'team_score', label: 'Tm PTS', align: 'right' },
  { key: 'opp_score', label: 'Opp PTS', align: 'right' },
  { key: 'minutes_played', label: 'MP', align: 'right' },
  { key: 'fgm', label: 'FG', align: 'right' },
  { key: 'fga', label: 'FGA', align: 'right' },
  { key: 'fg3m', label: '3P', align: 'right' },
  { key: 'fg3a', label: '3PA', align: 'right' },
  { key: 'ftm', label: 'FT', align: 'right' },
  { key: 'fta', label: 'FTA', align: 'right' },
  { key: 'pts', label: 'PTS', align: 'right' },
  { key: 'reb', label: 'REB', align: 'right' },
  { key: 'ast', label: 'AST', align: 'right' },
  { key: 'stl', label: 'STL', align: 'right' },
  { key: 'blk', label: 'BLK', align: 'right' },
  { key: 'tov', label: 'TOV', align: 'right' },
  { key: 'gmsc', label: 'GmSc', align: 'right' },
  { key: 'plus_minus', label: '+/-', align: 'right' },
] as const;

export const AWARDS_COLUMNS: StatsTableColumn[] = [
  { key: 'season_id', label: 'Season', link: { type: 'league' } },
  { key: 'award_name', label: 'Award' },
  { key: 'award_type', label: 'Type' },
] as const;

export const SALARY_COLUMNS: StatsTableColumn[] = [
  { key: 'season_id', label: 'Season', link: { type: 'league' } },
  { key: 'team_abbrev', label: 'Team', link: { type: 'team' } },
  { key: 'salary_fmt', label: 'Salary', align: 'right' },
] as const;

export function buildPlayerRelatedLinks(
  letter: string,
  id: string,
  fullName: string
): Array<{ href: Route; label: string; description: string }> {
  return [
    {
      href: `/players/${letter}/${id}/splits` as Route,
      label: 'Player Splits',
      description: 'Opponent and situational split tables for this player.',
    },
    {
      href: routes.search(fullName),
      label: 'Search Similar Results',
      description: 'Jump back into search using this player name as the starting point.',
    },
    {
      href: '/leaders' as Route,
      label: 'League Leaders',
      description: 'Compare this player against current and all-time league leaders.',
    },
    {
      href: `/players/${letter}` as Route,
      label: `More ${letter.toUpperCase()} Players`,
      description: 'Browse the alphabetical player directory around this profile.',
    },
  ];
}

export function buildCareerData(
  perGameStats: Array<Record<string, string | number | null>>
): CareerSeasonData[] {
  return perGameStats
    .filter(
      row =>
        row['season_id'] != null &&
        row['pts_pg'] != null &&
        row['reb_pg'] != null &&
        row['ast_pg'] != null
    )
    .slice()
    .sort((a, b) => String(a['season_id']).localeCompare(String(b['season_id'])))
    .map(row => ({
      season: String(row['season_id']),
      ppg: Number(row['pts_pg']),
      rpg: Number(row['reb_pg']),
      apg: Number(row['ast_pg']),
    }));
}
