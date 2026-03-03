import { describe, expect, it } from 'vitest';
import {
  getTeamByAbbrev,
  getTeamRoster,
  getTeamRosterWithStats,
  getTeamSeasonStats,
  getTeamCurrentSeasonSummary,
  getTeamRecentGames,
} from './teams';

describe('team queries', () => {
  const TEST_TEAM_ABBREV = 'LAL';

  describe('getTeamByAbbrev', () => {
    it('finds a known team', () => {
      const team = getTeamByAbbrev(TEST_TEAM_ABBREV);
      expect(team).toBeTruthy();
      expect(team?.abbreviation).toBe(TEST_TEAM_ABBREV);
    });

    it('returns undefined for unknown team', () => {
      const team = getTeamByAbbrev('XXX');
      expect(team).toBeUndefined();
    });

    it('returns team with required fields', () => {
      const team = getTeamByAbbrev(TEST_TEAM_ABBREV);
      expect(team).toHaveProperty('team_id');
      expect(team).toHaveProperty('full_name');
      expect(team).toHaveProperty('city');
    });
  });

  describe('getTeamSeasonStats', () => {
    it('returns season stats array', () => {
      const stats = getTeamSeasonStats(TEST_TEAM_ABBREV);
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
    });

    it('returns stats with required fields', () => {
      const stats = getTeamSeasonStats(TEST_TEAM_ABBREV);
      const first = stats[0];
      expect(first).toHaveProperty('season_id');
      expect(first).toHaveProperty('w');
      expect(first).toHaveProperty('l');
    });
  });

  describe('getTeamRoster', () => {
    it('returns roster for a team', () => {
      const team = getTeamByAbbrev(TEST_TEAM_ABBREV);
      if (team == null) {
        throw new Error('Expected team to be defined');
      }
      const roster = getTeamRoster(team.team_id);
      expect(Array.isArray(roster)).toBe(true);
    });

    it('returns players with required fields', () => {
      const team = getTeamByAbbrev(TEST_TEAM_ABBREV);
      if (team == null) {
        throw new Error('Expected team to be defined');
      }
      const roster = getTeamRoster(team.team_id);
      if (roster.length > 0) {
        const player = roster[0];
        expect(player).toHaveProperty('bref_id');
        expect(player).toHaveProperty('full_name');
      }
    });
  });

  describe('getTeamRosterWithStats', () => {
    it('returns roster with stats', () => {
      const team = getTeamByAbbrev(TEST_TEAM_ABBREV);
      if (team == null) {
        throw new Error('Expected team to be defined');
      }
      const roster = getTeamRosterWithStats(team.team_id);
      expect(Array.isArray(roster)).toBe(true);
    });
  });

  describe('getTeamCurrentSeasonSummary', () => {
    it('returns current season summary', () => {
      const summary = getTeamCurrentSeasonSummary(TEST_TEAM_ABBREV);
      expect(summary).toBeTruthy();
      expect(summary).toHaveProperty('w');
      expect(summary).toHaveProperty('l');
    });
  });

  describe('getTeamRecentGames', () => {
    it('returns recent games array', () => {
      const team = getTeamByAbbrev(TEST_TEAM_ABBREV);
      if (team == null) {
        throw new Error('Expected team to be defined');
      }
      const games = getTeamRecentGames(team.team_id);
      expect(Array.isArray(games)).toBe(true);
    });

    it('returns games with result field', () => {
      const team = getTeamByAbbrev(TEST_TEAM_ABBREV);
      if (team == null) {
        throw new Error('Expected team to be defined');
      }
      const games = getTeamRecentGames(team.team_id, 5);
      if (games.length > 0) {
        const game = games[0];
        expect(game).toHaveProperty('result');
      }
    });
  });
});
