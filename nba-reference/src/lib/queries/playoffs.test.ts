import { describe, expect, it } from 'vitest';
import {
  getPlayoffSeasons,
  getPlayoffSeriesBySeason,
  getPlayoffSeriesGames,
  getPlayoffLeaders,
  getNBAFinals,
  getSeasonChampion,
  getPlayoffBracket,
} from '@/lib/queries/playoffs';

describe('playoffs queries', () => {
  const TEST_SEASON_ID = '2024-25';

  // ---------------------------------------------------------------------------
  // getPlayoffSeasons
  // ---------------------------------------------------------------------------

  describe('getPlayoffSeasons', () => {
    it('returns a non-empty array of playoff seasons', () => {
      const seasons = getPlayoffSeasons();
      expect(Array.isArray(seasons)).toBe(true);
      expect(seasons.length).toBeGreaterThan(0);
    });

    it('each season has required fields', () => {
      const seasons = getPlayoffSeasons();
      const first = seasons[0];
      if (first === undefined) throw new Error('Expected non-empty playoff seasons');
      expect(first).toHaveProperty('season_id');
      expect(first).toHaveProperty('start_year');
      expect(first).toHaveProperty('end_year');
    });

    it('seasons are ordered newest first', () => {
      const seasons = getPlayoffSeasons();
      if (seasons.length < 2) return;
      const first = seasons[0];
      const second = seasons[1];
      if (first === undefined || second === undefined) return;
      expect(first.start_year).toBeGreaterThanOrEqual(second.start_year);
    });
  });

  // ---------------------------------------------------------------------------
  // getPlayoffSeriesBySeason
  // ---------------------------------------------------------------------------

  describe('getPlayoffSeriesBySeason', () => {
    it('returns series for a known playoff season', () => {
      const series = getPlayoffSeriesBySeason(TEST_SEASON_ID);
      expect(Array.isArray(series)).toBe(true);
    });

    it('returns empty array for a season without playoffs', () => {
      const series = getPlayoffSeriesBySeason('1900-01');
      expect(series).toHaveLength(0);
    });

    it('series entries have required fields', () => {
      const series = getPlayoffSeriesBySeason(TEST_SEASON_ID);
      if (series.length === 0) return;
      const first = series[0];
      expect(first).toHaveProperty('home_abbrev');
      expect(first).toHaveProperty('away_abbrev');
      expect(first).toHaveProperty('home_wins');
      expect(first).toHaveProperty('away_wins');
      expect(first).toHaveProperty('winner_abbrev');
      expect(first).toHaveProperty('series_id');
    });

    it('winner_abbrev matches the team with more wins', () => {
      const series = getPlayoffSeriesBySeason(TEST_SEASON_ID);
      for (const s of series) {
        if (s.home_wins > s.away_wins) {
          expect(s.winner_abbrev).toBe(s.home_abbrev);
        } else {
          expect(s.winner_abbrev).toBe(s.away_abbrev);
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getPlayoffSeriesGames
  // ---------------------------------------------------------------------------

  describe('getPlayoffSeriesGames', () => {
    it('returns game results for a valid series', () => {
      const series = getPlayoffSeriesBySeason(TEST_SEASON_ID);
      if (series.length === 0) return;
      const firstSeries = series[0];
      if (firstSeries === undefined) return;
      const games = getPlayoffSeriesGames(
        TEST_SEASON_ID,
        firstSeries.home_abbrev,
        firstSeries.away_abbrev
      );
      expect(Array.isArray(games)).toBe(true);
    });

    it('returns empty array for non-existent series', () => {
      const games = getPlayoffSeriesGames(TEST_SEASON_ID, 'XXX', 'YYY');
      expect(games).toHaveLength(0);
    });

    it('game entries have required fields', () => {
      const series = getPlayoffSeriesBySeason(TEST_SEASON_ID);
      if (series.length === 0) return;
      const firstSeries = series[0];
      if (firstSeries === undefined) return;
      const games = getPlayoffSeriesGames(
        TEST_SEASON_ID,
        firstSeries.home_abbrev,
        firstSeries.away_abbrev
      );
      if (games.length === 0) return;
      const first = games[0];
      expect(first).toHaveProperty('game_id');
      expect(first).toHaveProperty('game_date');
      expect(first).toHaveProperty('home_score');
      expect(first).toHaveProperty('away_score');
      expect(first).toHaveProperty('winner_abbrev');
    });

    it('games are ordered by date', () => {
      const series = getPlayoffSeriesBySeason(TEST_SEASON_ID);
      if (series.length === 0) return;
      const firstSeries = series[0];
      if (firstSeries === undefined) return;
      const games = getPlayoffSeriesGames(
        TEST_SEASON_ID,
        firstSeries.home_abbrev,
        firstSeries.away_abbrev
      );
      for (let i = 1; i < games.length; i++) {
        const current = games[i];
        const previous = games[i - 1];
        if (current === undefined || previous === undefined) continue;
        expect(new Date(current.game_date).getTime()).toBeGreaterThanOrEqual(
          new Date(previous.game_date).getTime()
        );
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getPlayoffLeaders
  // ---------------------------------------------------------------------------

  describe('getPlayoffLeaders', () => {
    it('returns playoff scoring leaders for a known season', () => {
      const leaders = getPlayoffLeaders(TEST_SEASON_ID, 'pts');
      expect(Array.isArray(leaders)).toBe(true);
    });

    it('returns empty array for a season without playoffs', () => {
      const leaders = getPlayoffLeaders('1900-01', 'pts');
      expect(leaders).toHaveLength(0);
    });

    it('leader entries have required fields', () => {
      const leaders = getPlayoffLeaders(TEST_SEASON_ID, 'pts');
      if (leaders.length === 0) return;
      const first = leaders[0];
      expect(first).toHaveProperty('bref_id');
      expect(first).toHaveProperty('full_name');
      expect(first).toHaveProperty('team_abbrev');
      expect(first).toHaveProperty('games');
    });

    it('respects limit parameter', () => {
      const leaders = getPlayoffLeaders(TEST_SEASON_ID, 'pts', 3);
      expect(leaders.length).toBeLessThanOrEqual(3);
    });

    it('all leaders have at least 3 games played', () => {
      const leaders = getPlayoffLeaders(TEST_SEASON_ID, 'pts');
      for (const leader of leaders) {
        expect(leader.games).toBeGreaterThanOrEqual(3);
      }
    });

    it('returns rebound leaders when stat is reb', () => {
      const leaders = getPlayoffLeaders(TEST_SEASON_ID, 'reb');
      if (leaders.length === 0) return;
      const first = leaders[0];
      expect(first).toHaveProperty('total_reb');
      expect(first).toHaveProperty('reb_pg');
    });

    it('returns assist leaders when stat is ast', () => {
      const leaders = getPlayoffLeaders(TEST_SEASON_ID, 'ast');
      if (leaders.length === 0) return;
      const first = leaders[0];
      expect(first).toHaveProperty('total_ast');
      expect(first).toHaveProperty('ast_pg');
    });

    it('defaults to points when no stat specified', () => {
      const leaders = getPlayoffLeaders(TEST_SEASON_ID);
      expect(Array.isArray(leaders)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getNBAFinals
  // ---------------------------------------------------------------------------

  describe('getNBAFinals', () => {
    it('returns Finals result for a known playoff season', () => {
      const finals = getNBAFinals(TEST_SEASON_ID);
      expect(finals).toBeTruthy();
    });

    it('returns undefined for a season without playoffs', () => {
      const finals = getNBAFinals('1900-01');
      expect(finals).toBeUndefined();
    });

    it('Finals result has required fields', () => {
      const finals = getNBAFinals(TEST_SEASON_ID);
      if (finals === undefined) throw new Error('Expected Finals result');
      expect(finals).toHaveProperty('home_abbrev');
      expect(finals).toHaveProperty('away_abbrev');
      expect(finals).toHaveProperty('home_wins');
      expect(finals).toHaveProperty('away_wins');
      expect(finals).toHaveProperty('winner_abbrev');
      expect(finals).toHaveProperty('series_id');
    });
  });

  // ---------------------------------------------------------------------------
  // getSeasonChampion
  // ---------------------------------------------------------------------------

  describe('getSeasonChampion', () => {
    it('returns champion or undefined for a playoff season', () => {
      const champion = getSeasonChampion(TEST_SEASON_ID);
      if (champion != null) {
        expect(typeof champion).toBe('string');
        expect(champion.length).toBeGreaterThan(0);
      }
    });

    it('returns undefined for a season without playoffs', () => {
      const champion = getSeasonChampion('1900-01');
      expect(champion).toBeUndefined();
    });

    it('champion matches the Finals winner when both exist', () => {
      const finals = getNBAFinals(TEST_SEASON_ID);
      const champion = getSeasonChampion(TEST_SEASON_ID);
      if (finals === undefined || champion === undefined) return;
      expect(champion).toBe(finals.winner_abbrev);
    });
  });

  // ---------------------------------------------------------------------------
  // getPlayoffBracket
  // ---------------------------------------------------------------------------

  describe('getPlayoffBracket', () => {
    it('returns bracket object for a known playoff season', () => {
      const bracket = getPlayoffBracket(TEST_SEASON_ID);
      expect(bracket).toHaveProperty('east');
      expect(bracket).toHaveProperty('west');
      expect(bracket).toHaveProperty('finals');
    });

    it('east and west are objects (may be empty)', () => {
      const bracket = getPlayoffBracket(TEST_SEASON_ID);
      expect(typeof bracket.east).toBe('object');
      expect(typeof bracket.west).toBe('object');
    });

    it('returns bracket with empty rounds for a season without playoffs', () => {
      const bracket = getPlayoffBracket('1900-01');
      expect(typeof bracket.east).toBe('object');
      expect(typeof bracket.west).toBe('object');
      expect(bracket.finals).toBeUndefined();
    });
  });
});
