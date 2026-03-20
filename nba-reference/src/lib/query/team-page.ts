import {
  getTeamByAbbrev,
  getTeamCurrentSeasonSummary,
  getTeamFourFactorsComparison,
  getTeamPerGameAverages,
  getTeamPlayerLeaders,
  getTeamRecentGames,
  getTeamRosterWithStats,
  getTeamSeasonStats,
} from '@/lib/queries';

type DbRecord = Record<string, string | number | null>;

export interface TeamPageData {
  averages: Record<string, number | null> | undefined;
  current: DbRecord | undefined;
  fourFactors: DbRecord | undefined;
  leaders: DbRecord[];
  recentGames: DbRecord[];
  roster: DbRecord[];
  seasonLabel: string;
  seasonLinks: string[];
  seasonStats: DbRecord[];
  team: ReturnType<typeof getTeamByAbbrev>;
}

export function getTeamPageData(teamAbbrev: string): TeamPageData | undefined {
  const team = getTeamByAbbrev(teamAbbrev);
  if (team == null) {
    return undefined;
  }

  const roster = getTeamRosterWithStats(team.team_id);
  const seasonStats = getTeamSeasonStats(team.abbreviation);
  const current = getTeamCurrentSeasonSummary(team.abbreviation);
  const fourFactors = getTeamFourFactorsComparison(team.abbreviation);
  const recentGames = getTeamRecentGames(team.team_id, 20);
  const averages = getTeamPerGameAverages(team.team_id);
  const leaders = getTeamPlayerLeaders(team.team_id, 12);
  const seasonLabel =
    (typeof current?.['season_id'] === 'string' ? current['season_id'] : null) ??
    (typeof seasonStats[0]?.['season_id'] === 'string' ? seasonStats[0]['season_id'] : null) ??
    'Current';
  const seasonLinks = seasonStats
    .map(row => (typeof row['season_id'] === 'string' ? row['season_id'] : ''))
    .filter((seasonId): seasonId is string => /^\d{4}-\d{2}$/.test(seasonId))
    .slice(0, 10);

  return {
    averages,
    current,
    fourFactors,
    leaders,
    recentGames,
    roster,
    seasonLabel,
    seasonLinks,
    seasonStats,
    team,
  };
}
