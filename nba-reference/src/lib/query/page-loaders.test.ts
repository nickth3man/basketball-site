import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/queries', () => ({
  getGameById: vi.fn(),
  getGameLineScore: vi.fn(),
  getGamePbpEvents: vi.fn(),
  getGamePlayerAdvancedBoxScore: vi.fn(),
  getGamePlayerBoxScore: vi.fn(),
  getGameTeamBoxScores: vi.fn(),
  getGameTeamFourFactors: vi.fn(),
  getPlayerAdjustedShootingStats: vi.fn(),
  getPlayerAdvancedSeasonStats: vi.fn(),
  getPlayerAwards: vi.fn(),
  getPlayerByBrefId: vi.fn(),
  getPlayerCareerSummary: vi.fn(),
  getPlayerFullGameLog: vi.fn(),
  getPlayerGameHighs: vi.fn(),
  getPlayerPer100Stats: vi.fn(),
  getPlayerPer36Stats: vi.fn(),
  getPlayerPerGameStats: vi.fn(),
  getPlayerPbpSeasonStats: vi.fn(),
  getPlayerSalaries: vi.fn(),
  getPlayerSeasonStats: vi.fn(),
  getPlayerShootingSeasonStats: vi.fn(),
  getTeamByAbbrev: vi.fn(),
  getTeamCurrentSeasonSummary: vi.fn(),
  getTeamFourFactorsComparison: vi.fn(),
  getTeamPerGameAverages: vi.fn(),
  getTeamPlayerLeaders: vi.fn(),
  getTeamRecentGames: vi.fn(),
  getTeamRosterWithStats: vi.fn(),
  getTeamSeasonStats: vi.fn(),
}));

import * as queries from '@/lib/queries';
import { getGamePageData } from './game-page';
import { getPlayerPageData } from './player-page';
import { getTeamPageData } from './team-page';

const mockedQueries = vi.mocked(queries);

describe('page loaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds player page data with aggregated awards', () => {
    const player: NonNullable<ReturnType<typeof queries.getPlayerByBrefId>> = {
      bref_id: 'jamesle01',
      first_name: 'LeBron',
      last_name: 'James',
      player_id: '23',
      full_name: 'LeBron James',
      position: 'F',
      height_cm: 206,
      weight_kg: 113,
      birth_date: '1984-12-30',
      birth_city: 'Akron',
      birth_country: 'USA',
      college: 'St. Vincent-St. Mary HS',
      draft_year: 2003,
      draft_round: 1,
      draft_number: 1,
      is_active: 1,
      hof: 0,
    };
    mockedQueries.getPlayerByBrefId.mockReturnValue(player);
    mockedQueries.getPlayerPerGameStats.mockReturnValue([]);
    mockedQueries.getPlayerPer36Stats.mockReturnValue([]);
    mockedQueries.getPlayerPer100Stats.mockReturnValue([]);
    mockedQueries.getPlayerSeasonStats.mockReturnValue([]);
    mockedQueries.getPlayerAdvancedSeasonStats.mockReturnValue([]);
    mockedQueries.getPlayerShootingSeasonStats.mockReturnValue([]);
    mockedQueries.getPlayerAdjustedShootingStats.mockReturnValue([]);
    mockedQueries.getPlayerPbpSeasonStats.mockReturnValue([]);
    mockedQueries.getPlayerFullGameLog.mockReturnValue([]);
    mockedQueries.getPlayerAwards.mockReturnValue([
      { award_name: 'MVP', season_id: '2012-13', award_type: 'individual' },
      { award_name: 'MVP', season_id: '2011-12', award_type: 'individual' },
      { award_name: 'All-NBA', season_id: '2012-13', award_type: 'team' },
    ]);
    mockedQueries.getPlayerSalaries.mockReturnValue([]);
    mockedQueries.getPlayerCareerSummary.mockReturnValue({});
    mockedQueries.getPlayerGameHighs.mockReturnValue({});

    const data = getPlayerPageData('jamesle01');

    expect(data?.player?.full_name).toBe('LeBron James');
    expect(data?.awardCounts[0]).toEqual(['MVP', 2]);
    expect(mockedQueries.getPlayerFullGameLog).toHaveBeenCalledWith('23', 100);
  });

  it('builds team page data with season links', () => {
    const team: NonNullable<ReturnType<typeof queries.getTeamByAbbrev>> = {
      team_id: '14',
      abbreviation: 'LAL',
      full_name: 'Los Angeles Lakers',
      city: 'Los Angeles',
      nickname: 'Lakers',
      conference: 'West',
      division: 'Pacific',
      arena_name: 'Crypto.com Arena',
      founded_year: 1948,
    };
    mockedQueries.getTeamByAbbrev.mockReturnValue(team);
    mockedQueries.getTeamRosterWithStats.mockReturnValue([]);
    mockedQueries.getTeamSeasonStats.mockReturnValue([
      { season_id: '2024-25' },
      { season_id: '2023-24' },
    ]);
    mockedQueries.getTeamCurrentSeasonSummary.mockReturnValue({ season_id: '2024-25' });
    mockedQueries.getTeamFourFactorsComparison.mockReturnValue(undefined);
    mockedQueries.getTeamRecentGames.mockReturnValue([]);
    mockedQueries.getTeamPerGameAverages.mockReturnValue(undefined);
    mockedQueries.getTeamPlayerLeaders.mockReturnValue([]);

    const data = getTeamPageData('LAL');

    expect(data?.team?.abbreviation).toBe('LAL');
    expect(data?.seasonLabel).toBe('2024-25');
    expect(data?.seasonLinks).toEqual(['2024-25', '2023-24']);
  });

  it('builds game page data with home and away partitions', () => {
    const game: NonNullable<ReturnType<typeof queries.getGameById>> = {
      away_abbrev: 'LAL',
      home_abbrev: 'BOS',
    };
    mockedQueries.getGameById.mockReturnValue(game);
    mockedQueries.getGameTeamBoxScores.mockReturnValue([]);
    mockedQueries.getGamePlayerBoxScore.mockReturnValue([
      { team: 'LAL', full_name: 'Away Player' },
      { team: 'BOS', full_name: 'Home Player' },
    ]);
    mockedQueries.getGamePlayerAdvancedBoxScore.mockReturnValue([
      { team: 'LAL', full_name: 'Away Player' },
      { team: 'BOS', full_name: 'Home Player' },
    ]);
    mockedQueries.getGameLineScore.mockReturnValue([]);
    mockedQueries.getGameTeamFourFactors.mockReturnValue([]);
    mockedQueries.getGamePbpEvents.mockReturnValue([]);

    const data = getGamePageData('0022400001');

    expect(data?.awayTeam).toBe('LAL');
    expect(data?.homeTeam).toBe('BOS');
    expect(data?.awayPlayers).toHaveLength(1);
    expect(data?.homeAdvanced).toHaveLength(1);
    expect(mockedQueries.getGamePbpEvents).toHaveBeenCalledWith('0022400001', 50);
  });
});
