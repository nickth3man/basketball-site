import type { NbaFinalsRow, PlayoffSeriesRow } from './playoffs';

const EAST_PLAYOFF_TEAMS = new Set([
  'BOS',
  'BRK',
  'NYK',
  'PHI',
  'TOR',
  'CHI',
  'CLE',
  'IND',
  'DET',
  'MIL',
  'ATL',
  'CHO',
  'MIA',
  'ORL',
  'WAS',
]);

const WEST_PLAYOFF_TEAMS = new Set([
  'DEN',
  'MIN',
  'OKC',
  'POR',
  'UTA',
  'GSW',
  'LAC',
  'LAL',
  'PHO',
  'SAC',
  'DAL',
  'HOU',
  'MEM',
  'NOP',
  'SAS',
]);

export function buildPlayoffBracket(
  allSeries: PlayoffSeriesRow[],
  finals: NbaFinalsRow | undefined
): {
  east: Record<string, PlayoffSeriesRow[]>;
  west: Record<string, PlayoffSeriesRow[]>;
  finals: NbaFinalsRow | undefined;
} {
  const east: Record<string, PlayoffSeriesRow[]> = {
    'First Round': [],
    'Conference Semifinals': [],
    'Conference Finals': [],
  };
  const west: Record<string, PlayoffSeriesRow[]> = {
    'First Round': [],
    'Conference Semifinals': [],
    'Conference Finals': [],
  };

  for (const series of allSeries) {
    const homeAbbrev = series.home_abbrev;
    const awayAbbrev = series.away_abbrev;
    const round = series.total_games >= 4 ? 'Conference Semifinals' : 'First Round';

    if (EAST_PLAYOFF_TEAMS.has(homeAbbrev) && EAST_PLAYOFF_TEAMS.has(awayAbbrev)) {
      east[round] = [...(east[round] ?? []), series];
    } else if (WEST_PLAYOFF_TEAMS.has(homeAbbrev) && WEST_PLAYOFF_TEAMS.has(awayAbbrev)) {
      west[round] = [...(west[round] ?? []), series];
    }
  }

  return { east, west, finals };
}
