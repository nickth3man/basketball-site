import { describe, expect, it } from 'vitest';
import { getTeamByAbbrev } from '@/lib/queries/teams';
import { getPlayerByBrefId } from '@/lib/queries/players/profile';
import {
  getPlayerShootingSeasonStats,
  getPlayerAdjustedShootingStats,
  getPlayerPbpSeasonStats,
} from '@/lib/queries/players/advanced';
import {
  getPlayerRecentGames,
  getPlayerFullGameLog,
  getPlayerVsOpponentStats,
} from '@/lib/queries/players/games';
import { getPlayerAwards, getPlayerSalaries } from '@/lib/queries/players/career';
import {
  getPlayerHomeAwaySplits,
  getPlayerMonthlySplits,
  getPlayerOpponentSplits,
  getPlayerDivisionSplits,
  getPlayerLatestSeason,
} from '@/lib/queries/player-splits';
import {
  getCurrentSeasonId,
  getCurrentStandings,
  getAvailableDates,
  getMostRecentGameDate,
  getSeasonsWithGames,
} from '@/lib/queries/standings';
import {
  getLatestSeasonWithPlayerStats,
  getSeasonLeadersByPerGame,
  getAllTimeLeadersByTotal,
} from '@/lib/queries/leaders';
import { getDraftSeasons, getDraftBySeason } from '@/lib/queries/draft';
import {
  getFranchiseHistory,
  getFranchiseSeasons,
  getFranchiseChampionships,
  getCurrentFranchiseInfo,
} from '@/lib/queries/franchise';
import {
  getPlayersByBirthday,
  getAllBirthdaysGrouped,
  getPlayersByCollege,
  getTodayBirthdays,
} from '@/lib/queries/frivolities';
import {
  getAllStarSeasons,
  getAllStarRosters,
  getAllStarMVP,
  getPlayerAllStarSelections,
} from '@/lib/queries/allstar';
import {
  getMVPHistory,
  getDPOYHistory,
  getROYHistory,
  getAllNBAHistory,
  getAllDefensiveHistory,
  getAwardTypes,
  getAwardWinners,
  getSeasonAwards,
} from '@/lib/queries/awards';
import {
  getPlayoffSeasons,
  getPlayoffSeriesBySeason,
  getPlayoffSeriesGames,
  getPlayoffLeaders,
  getNBAFinals,
  getSeasonChampion,
  getPlayoffBracket,
} from '@/lib/queries/playoffs';
import { getTeamSchedule, getTeamRecordAsOf } from '@/lib/queries/team-schedule';

describe('additional query coverage', () => {
  const TEST_TEAM_ABBREV = 'LAL';
  const TEST_PLAYER_BREF = 'jamesle01';

  it('covers standings and leaders modules', () => {
    const seasons = getSeasonsWithGames();
    expect(Array.isArray(seasons)).toBe(true);
    expect(seasons.length).toBeGreaterThan(0);

    const seasonId = seasons[0]?.season_id ?? getCurrentSeasonId();
    expect(typeof seasonId).toBe('string');

    const dates = getAvailableDates(seasonId);
    expect(Array.isArray(dates)).toBe(true);

    const recentDate = getMostRecentGameDate(seasonId);
    if (dates.length > 0) {
      expect(recentDate).toBeTruthy();
    }

    const standings = getCurrentStandings(seasonId);
    expect(Array.isArray(standings)).toBe(true);
    if (standings.length > 0) {
      expect(standings[0]).toHaveProperty('team_abbrev');
      expect(standings[0]).toHaveProperty('win_pct');
    }

    const latestPlayerSeason = getLatestSeasonWithPlayerStats();
    expect(latestPlayerSeason).toBeTruthy();
    if (latestPlayerSeason != null) {
      const leaders = getSeasonLeadersByPerGame(latestPlayerSeason, 'pts', 5);
      expect(leaders.length).toBeLessThanOrEqual(5);
      const allTime = getAllTimeLeadersByTotal('reb', 5);
      expect(allTime.length).toBeLessThanOrEqual(5);
    }
  });

  it('covers draft, franchise, and frivolities modules', () => {
    const draftSeasons = getDraftSeasons(5);
    expect(draftSeasons.length).toBeLessThanOrEqual(5);
    const firstDraftSeason = draftSeasons[0];
    if (firstDraftSeason != null) {
      const draftBoard = getDraftBySeason(firstDraftSeason.season_id);
      expect(Array.isArray(draftBoard)).toBe(true);
    }

    const history = getFranchiseHistory(TEST_TEAM_ABBREV);
    expect(Array.isArray(history)).toBe(true);
    const seasons = getFranchiseSeasons(TEST_TEAM_ABBREV);
    expect(Array.isArray(seasons)).toBe(true);
    const chips = getFranchiseChampionships(TEST_TEAM_ABBREV);
    expect(Array.isArray(chips)).toBe(true);

    const info = getCurrentFranchiseInfo(TEST_TEAM_ABBREV);
    expect(info).toBeTruthy();
    expect(info).toHaveProperty('team_name');

    const colleges = getPlayersByCollege();
    expect(Array.isArray(colleges)).toBe(true);
    const groupedBirthdays = getAllBirthdaysGrouped();
    expect(Array.isArray(groupedBirthdays)).toBe(true);
    const todayBirthdays = getTodayBirthdays();
    expect(Array.isArray(todayBirthdays)).toBe(true);

    const lebronBirthdayList = getPlayersByBirthday(12, 30);
    expect(Array.isArray(lebronBirthdayList)).toBe(true);
  });

  it('covers all-star, awards, and playoffs modules', () => {
    const allStarSeasons = getAllStarSeasons();
    expect(Array.isArray(allStarSeasons)).toBe(true);
    const firstAllStarSeason = allStarSeasons[0];
    if (firstAllStarSeason != null) {
      const allStarSeasonId = firstAllStarSeason.season_id;
      const rosters = getAllStarRosters(allStarSeasonId);
      expect(Array.isArray(rosters.teams)).toBe(true);

      const mvp = getAllStarMVP(allStarSeasonId);
      if (mvp != null) {
        expect(mvp).toHaveProperty('full_name');
      }
    }

    const mvpHistory = getMVPHistory();
    const dpoyHistory = getDPOYHistory();
    const royHistory = getROYHistory();
    const allNbaHistory = getAllNBAHistory();
    const allDefHistory = getAllDefensiveHistory();
    expect(Array.isArray(mvpHistory)).toBe(true);
    expect(Array.isArray(dpoyHistory)).toBe(true);
    expect(Array.isArray(royHistory)).toBe(true);
    expect(Array.isArray(allNbaHistory)).toBe(true);
    expect(Array.isArray(allDefHistory)).toBe(true);

    const awardTypes = getAwardTypes();
    expect(Array.isArray(awardTypes)).toBe(true);
    const firstAwardType = awardTypes[0];
    if (firstAwardType != null) {
      const winners = getAwardWinners(firstAwardType);
      expect(Array.isArray(winners)).toBe(true);
    }

    if (mvpHistory.length > 0 && typeof mvpHistory[0]?.season_id === 'string') {
      const seasonAwards = getSeasonAwards(mvpHistory[0].season_id);
      expect(seasonAwards).toHaveProperty('allNBA');
      expect(seasonAwards).toHaveProperty('allDefense');
    }

    const playoffSeasons = getPlayoffSeasons();
    expect(Array.isArray(playoffSeasons)).toBe(true);
    const firstPlayoffSeason = playoffSeasons[0];
    if (firstPlayoffSeason != null) {
      const playoffSeasonId = firstPlayoffSeason.season_id;
      const series = getPlayoffSeriesBySeason(playoffSeasonId);
      expect(Array.isArray(series)).toBe(true);

      const leaders = getPlayoffLeaders(playoffSeasonId, 'pts', 5);
      expect(leaders.length).toBeLessThanOrEqual(5);

      const finals = getNBAFinals(playoffSeasonId);
      if (finals != null) {
        expect(finals).toHaveProperty('winner_abbrev');
      }

      const champion = getSeasonChampion(playoffSeasonId);
      if (champion != null) {
        expect(typeof champion).toBe('string');
      }

      const bracket = getPlayoffBracket(playoffSeasonId);
      expect(typeof bracket.east).toBe('object');
      expect(typeof bracket.west).toBe('object');

      const firstSeries = series[0];
      const homeAbbrev = firstSeries?.home_abbrev;
      const awayAbbrev = firstSeries?.away_abbrev;
      if (typeof homeAbbrev === 'string' && typeof awayAbbrev === 'string') {
        const games = getPlayoffSeriesGames(playoffSeasonId, homeAbbrev, awayAbbrev);
        expect(Array.isArray(games)).toBe(true);
      }
    }
  });

  it('covers player split/game/career and team schedule modules', () => {
    const player = getPlayerByBrefId(TEST_PLAYER_BREF);
    expect(player).toBeTruthy();
    if (!player) return;

    const playerId = player.player_id;
    const latestSeason = getPlayerLatestSeason(playerId);
    if (latestSeason != null && latestSeason.length > 0) {
      expect(Array.isArray(getPlayerHomeAwaySplits(playerId, latestSeason))).toBe(true);
      expect(Array.isArray(getPlayerMonthlySplits(playerId, latestSeason))).toBe(true);
      expect(Array.isArray(getPlayerOpponentSplits(playerId, latestSeason))).toBe(true);
      expect(Array.isArray(getPlayerDivisionSplits(playerId, latestSeason))).toBe(true);

      expect(Array.isArray(getPlayerShootingSeasonStats(TEST_PLAYER_BREF, 3))).toBe(true);
      expect(Array.isArray(getPlayerAdjustedShootingStats(TEST_PLAYER_BREF, 3))).toBe(true);
      expect(Array.isArray(getPlayerPbpSeasonStats(TEST_PLAYER_BREF, 3))).toBe(true);
    }

    const recentGames = getPlayerRecentGames(playerId, 5);
    expect(Array.isArray(recentGames)).toBe(true);

    const gameLog = getPlayerFullGameLog(playerId, 5);
    expect(Array.isArray(gameLog)).toBe(true);

    const celtics = getTeamByAbbrev('BOS');
    if (celtics != null) {
      const vsStats = getPlayerVsOpponentStats(playerId, celtics.team_id);
      expect(vsStats).toHaveProperty('g');
      expect(vsStats).toHaveProperty('pts_pg');
    }

    const awards = getPlayerAwards(playerId, 5);
    const salaries = getPlayerSalaries(playerId, 5);
    expect(Array.isArray(awards)).toBe(true);
    expect(Array.isArray(salaries)).toBe(true);

    const seasonId = getCurrentSeasonId();
    const schedule = getTeamSchedule(TEST_TEAM_ABBREV, seasonId);
    expect(Array.isArray(schedule)).toBe(true);

    const team = getTeamByAbbrev(TEST_TEAM_ABBREV);
    const playedGame = schedule.find(game => game.result !== 'Scheduled');
    if (team != null && playedGame != null) {
      const record = getTeamRecordAsOf(playedGame.game_id, team.team_id);
      expect(record).toHaveProperty('w');
      expect(record).toHaveProperty('l');
    }

    const allStarSelections = getPlayerAllStarSelections(TEST_PLAYER_BREF);
    expect(Array.isArray(allStarSelections)).toBe(true);
  });
});
