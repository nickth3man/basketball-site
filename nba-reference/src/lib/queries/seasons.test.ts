import { describe, expect, it } from 'vitest';
import {
  getSeasonList,
  getSeasonStandings,
  getSeasonScoringLeaders,
  getSeasonReboundLeaders,
  getSeasonAssistLeaders,
  getSeasonLeagueSummary,
  getSeasonRecentGames,
} from '@/lib/queries/seasons';

describe('season queries', () => {
  const TEST_SEASON_ID = '2024-25';

  describe('getSeasonList', () => {
    it('returns seasons array', () => {
      const seasons = getSeasonList();
      expect(Array.isArray(seasons)).toBe(true);
      expect(seasons.length).toBeGreaterThan(0);
    });

    it('returns seasons with required fields', () => {
      const seasons = getSeasonList(5);
      const first = seasons[0];
      expect(first).toHaveProperty('season_id');
      expect(first).toHaveProperty('start_year');
      expect(first).toHaveProperty('end_year');
    });

    it('respects limit parameter', () => {
      const seasons = getSeasonList(3);
      expect(seasons.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getSeasonStandings', () => {
    it('returns standings array', () => {
      const standings = getSeasonStandings(TEST_SEASON_ID);
      expect(Array.isArray(standings)).toBe(true);
      expect(standings.length).toBeGreaterThan(0);
    });

    it('returns standings with required fields', () => {
      const standings = getSeasonStandings(TEST_SEASON_ID);
      const first = standings[0];
      expect(first).toHaveProperty('bref_abbrev');
      expect(first).toHaveProperty('w');
      expect(first).toHaveProperty('l');
    });
  });

  describe('getSeasonScoringLeaders', () => {
    it('returns scoring leaders array', () => {
      const leaders = getSeasonScoringLeaders(TEST_SEASON_ID);
      expect(Array.isArray(leaders)).toBe(true);
    });

    it('includes scoring stats', () => {
      const leaders = getSeasonScoringLeaders(TEST_SEASON_ID, 5);
      expect(leaders.length).toBeGreaterThan(0);
      const leader = leaders[0];
      if (leader === undefined) throw new Error('Expected non-empty scoring leaders');
      expect(leader).toHaveProperty('full_name');
      expect(leader).toHaveProperty('pts_pg');
      expect(leader).toHaveProperty('g');
    });

    it('respects limit parameter', () => {
      const leaders = getSeasonScoringLeaders(TEST_SEASON_ID, 3);
      expect(leaders.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getSeasonReboundLeaders', () => {
    it('returns rebound leaders array', () => {
      const leaders = getSeasonReboundLeaders(TEST_SEASON_ID);
      expect(Array.isArray(leaders)).toBe(true);
    });

    it('includes rebound stats', () => {
      const leaders = getSeasonReboundLeaders(TEST_SEASON_ID, 5);
      expect(leaders.length).toBeGreaterThan(0);
      const leader = leaders[0];
      if (leader === undefined) throw new Error('Expected non-empty rebound leaders');
      expect(leader).toHaveProperty('reb_pg');
    });
  });

  describe('getSeasonAssistLeaders', () => {
    it('returns assist leaders array', () => {
      const leaders = getSeasonAssistLeaders(TEST_SEASON_ID);
      expect(Array.isArray(leaders)).toBe(true);
    });

    it('includes assist stats', () => {
      const leaders = getSeasonAssistLeaders(TEST_SEASON_ID, 5);
      expect(leaders.length).toBeGreaterThan(0);
      const leader = leaders[0];
      if (leader === undefined) throw new Error('Expected non-empty assist leaders');
      expect(leader).toHaveProperty('ast_pg');
    });
  });

  describe('getSeasonLeagueSummary', () => {
    it('returns league summary object', () => {
      const summary = getSeasonLeagueSummary(TEST_SEASON_ID);
      expect(summary).toBeTruthy();
      expect(summary).toHaveProperty('ppg');
      expect(summary).toHaveProperty('rpg');
      expect(summary).toHaveProperty('apg');
    });
  });

  describe('getSeasonRecentGames', () => {
    it('returns recent games array', () => {
      const games = getSeasonRecentGames(TEST_SEASON_ID);
      expect(Array.isArray(games)).toBe(true);
    });

    it('returns games with required fields', () => {
      const games = getSeasonRecentGames(TEST_SEASON_ID, 5);
      expect(games.length).toBeGreaterThan(0);
      const game = games[0];
      if (game === undefined) throw new Error('Expected non-empty recent games');
      expect(game).toHaveProperty('game_id');
      expect(game).toHaveProperty('game_date');
      expect(game).toHaveProperty('home_score');
      expect(game).toHaveProperty('away_score');
    });
  });
});
