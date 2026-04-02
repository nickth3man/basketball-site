import { describe, expect, it } from 'vitest';
import {
  getStandingsAsOfDate,
  getAvailableDates,
  getMostRecentGameDate,
  getCurrentStandings,
  getCurrentSeasonId,
  getSeasonsWithGames,
} from '@/lib/queries/standings';

describe('standings queries', () => {
  const TEST_SEASON_ID = '2024-25';

  // ---------------------------------------------------------------------------
  // getStandingsAsOfDate
  // ---------------------------------------------------------------------------

  describe('getStandingsAsOfDate', () => {
    it('returns standings for a valid date in the season', () => {
      const standings = getStandingsAsOfDate('2025-04-01', TEST_SEASON_ID);
      expect(Array.isArray(standings)).toBe(true);
    });

    it('returns standings with required fields', () => {
      const standings = getStandingsAsOfDate('2025-04-01', TEST_SEASON_ID);
      if (standings.length === 0) return;
      const first = standings[0];
      expect(first).toHaveProperty('team_abbrev');
      expect(first).toHaveProperty('team_name');
      expect(first).toHaveProperty('conference');
      expect(first).toHaveProperty('w');
      expect(first).toHaveProperty('l');
      expect(first).toHaveProperty('win_pct');
      expect(first).toHaveProperty('gb');
    });

    it('returns empty array for a date before the season starts', () => {
      const standings = getStandingsAsOfDate('2024-01-01', TEST_SEASON_ID);
      expect(standings).toHaveLength(0);
    });

    it('win_pct is between 0 and 1', () => {
      const standings = getStandingsAsOfDate('2025-04-01', TEST_SEASON_ID);
      for (const team of standings) {
        expect(team.win_pct).toBeGreaterThanOrEqual(0);
        expect(team.win_pct).toBeLessThanOrEqual(1);
      }
    });

    it('gb is 0 for the conference leader', () => {
      const standings = getStandingsAsOfDate('2025-04-01', TEST_SEASON_ID);
      const eastTeams = standings.filter(t => t.conference === 'East');
      const westTeams = standings.filter(t => t.conference === 'West');
      if (eastTeams.length > 0) {
        expect(eastTeams[0]?.gb).toBe(0);
      }
      if (westTeams.length > 0) {
        expect(westTeams[0]?.gb).toBe(0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getAvailableDates
  // ---------------------------------------------------------------------------

  describe('getAvailableDates', () => {
    it('returns a non-empty array of dates for a known season', () => {
      const dates = getAvailableDates(TEST_SEASON_ID);
      expect(Array.isArray(dates)).toBe(true);
      expect(dates.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown season', () => {
      const dates = getAvailableDates('1900-01');
      expect(dates).toHaveLength(0);
    });

    it('dates are in chronological order', () => {
      const dates = getAvailableDates(TEST_SEASON_ID);
      for (let i = 1; i < dates.length; i++) {
        const current = dates[i];
        const previous = dates[i - 1];
        if (current === undefined || previous === undefined) continue;
        expect(new Date(current).getTime()).toBeGreaterThanOrEqual(new Date(previous).getTime());
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getMostRecentGameDate
  // ---------------------------------------------------------------------------

  describe('getMostRecentGameDate', () => {
    it('returns a date string for a known season', () => {
      const date = getMostRecentGameDate(TEST_SEASON_ID);
      expect(date).toBeTruthy();
      expect(typeof date).toBe('string');
      if (date === undefined) throw new Error('Expected a date string');
      expect(date.length).toBeGreaterThan(0);
    });

    it('returns null for unknown season', () => {
      const date = getMostRecentGameDate('1900-01');
      expect(date).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getCurrentStandings
  // ---------------------------------------------------------------------------

  describe('getCurrentStandings', () => {
    it('returns standings for the current season', () => {
      const standings = getCurrentStandings(TEST_SEASON_ID);
      expect(Array.isArray(standings)).toBe(true);
      expect(standings.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown season', () => {
      const standings = getCurrentStandings('1900-01');
      expect(standings).toHaveLength(0);
    });

    it('standings include both conferences', () => {
      const standings = getCurrentStandings(TEST_SEASON_ID);
      const conferences = new Set(standings.map(t => t.conference).filter(Boolean));
      expect(conferences.has('East')).toBe(true);
      expect(conferences.has('West')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getCurrentSeasonId
  // ---------------------------------------------------------------------------

  describe('getCurrentSeasonId', () => {
    it('returns a non-empty season ID string', () => {
      const seasonId = getCurrentSeasonId();
      expect(typeof seasonId).toBe('string');
      expect(seasonId.length).toBeGreaterThan(0);
    });

    it('season ID matches expected format (YYYY-YY)', () => {
      const seasonId = getCurrentSeasonId();
      expect(seasonId).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  // ---------------------------------------------------------------------------
  // getSeasonsWithGames
  // ---------------------------------------------------------------------------

  describe('getSeasonsWithGames', () => {
    it('returns a non-empty array of season records', () => {
      const seasons = getSeasonsWithGames();
      expect(Array.isArray(seasons)).toBe(true);
      expect(seasons.length).toBeGreaterThan(0);
    });

    it('each season has required fields', () => {
      const seasons = getSeasonsWithGames();
      const first = seasons[0];
      if (first === undefined) throw new Error('Expected non-empty seasons list');
      expect(first).toHaveProperty('season_id');
      expect(first).toHaveProperty('start_year');
      expect(first).toHaveProperty('end_year');
    });

    it('seasons are ordered newest first', () => {
      const seasons = getSeasonsWithGames();
      if (seasons.length < 2) return;
      const first = seasons[0];
      const second = seasons[1];
      if (first === undefined || second === undefined) return;
      expect(first.start_year).toBeGreaterThanOrEqual(second.start_year);
    });
  });
});
