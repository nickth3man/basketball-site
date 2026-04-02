import { describe, expect, it } from 'vitest';
import {
  getPlayerHomeAwaySplits,
  getPlayerMonthlySplits,
  getPlayerOpponentSplits,
  getPlayerDivisionSplits,
  getPlayerLatestSeason,
  getPlayerSplitSeasons,
} from '@/lib/queries/player-splits';

describe('player splits queries', () => {
  const TEST_PLAYER_ID = 'jamesle01';
  const TEST_SEASON_ID = '2024-25';

  // ---------------------------------------------------------------------------
  // getPlayerHomeAwaySplits
  // ---------------------------------------------------------------------------

  describe('getPlayerHomeAwaySplits', () => {
    it('returns splits for a known player', () => {
      const splits = getPlayerHomeAwaySplits(TEST_PLAYER_ID);
      expect(Array.isArray(splits)).toBe(true);
    });

    it('returns splits with required fields', () => {
      const splits = getPlayerHomeAwaySplits(TEST_PLAYER_ID);
      if (splits.length === 0) return;
      const first = splits[0];
      expect(first).toHaveProperty('split_value');
      expect(first).toHaveProperty('g');
      expect(first).toHaveProperty('mp');
      expect(first).toHaveProperty('pts');
      expect(first).toHaveProperty('reb');
      expect(first).toHaveProperty('ast');
    });

    it('returns splits for a specific season', () => {
      const splits = getPlayerHomeAwaySplits(TEST_PLAYER_ID, TEST_SEASON_ID);
      expect(Array.isArray(splits)).toBe(true);
    });

    it('returns empty array for unknown player', () => {
      const splits = getPlayerHomeAwaySplits('unknown00');
      expect(splits).toHaveLength(0);
    });

    it('split values are Home or Away', () => {
      const splits = getPlayerHomeAwaySplits(TEST_PLAYER_ID);
      for (const split of splits) {
        expect(['Home', 'Away']).toContain(split.split_value);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getPlayerMonthlySplits
  // ---------------------------------------------------------------------------

  describe('getPlayerMonthlySplits', () => {
    it('returns monthly splits for a known player', () => {
      const splits = getPlayerMonthlySplits(TEST_PLAYER_ID);
      expect(Array.isArray(splits)).toBe(true);
    });

    it('returns splits with required fields', () => {
      const splits = getPlayerMonthlySplits(TEST_PLAYER_ID);
      if (splits.length === 0) return;
      const first = splits[0];
      expect(first).toHaveProperty('split_value');
      expect(first).toHaveProperty('g');
      expect(first).toHaveProperty('pts');
    });

    it('returns monthly splits for a specific season', () => {
      const splits = getPlayerMonthlySplits(TEST_PLAYER_ID, TEST_SEASON_ID);
      expect(Array.isArray(splits)).toBe(true);
    });

    it('returns empty array for unknown player', () => {
      const splits = getPlayerMonthlySplits('unknown00');
      expect(splits).toHaveLength(0);
    });

    it('split values are valid month names', () => {
      const validMonths = [
        'January',
        'February',
        'March',
        'April',
        'October',
        'November',
        'December',
      ];
      const splits = getPlayerMonthlySplits(TEST_PLAYER_ID);
      for (const split of splits) {
        expect(validMonths).toContain(split.split_value);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getPlayerOpponentSplits
  // ---------------------------------------------------------------------------

  describe('getPlayerOpponentSplits', () => {
    it('returns opponent splits for a known player', () => {
      const splits = getPlayerOpponentSplits(TEST_PLAYER_ID);
      expect(Array.isArray(splits)).toBe(true);
    });

    it('returns splits with required fields', () => {
      const splits = getPlayerOpponentSplits(TEST_PLAYER_ID);
      if (splits.length === 0) return;
      const first = splits[0];
      expect(first).toHaveProperty('split_value');
      expect(first).toHaveProperty('g');
      expect(first).toHaveProperty('pts');
    });

    it('returns opponent splits for a specific season', () => {
      const splits = getPlayerOpponentSplits(TEST_PLAYER_ID, TEST_SEASON_ID);
      expect(Array.isArray(splits)).toBe(true);
    });

    it('returns empty array for unknown player', () => {
      const splits = getPlayerOpponentSplits('unknown00');
      expect(splits).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getPlayerDivisionSplits
  // ---------------------------------------------------------------------------

  describe('getPlayerDivisionSplits', () => {
    it('returns division splits for a known player', () => {
      const splits = getPlayerDivisionSplits(TEST_PLAYER_ID);
      expect(Array.isArray(splits)).toBe(true);
    });

    it('returns splits with required fields', () => {
      const splits = getPlayerDivisionSplits(TEST_PLAYER_ID);
      if (splits.length === 0) return;
      const first = splits[0];
      expect(first).toHaveProperty('split_value');
      expect(first).toHaveProperty('g');
      expect(first).toHaveProperty('pts');
    });

    it('returns division splits for a specific season', () => {
      const splits = getPlayerDivisionSplits(TEST_PLAYER_ID, TEST_SEASON_ID);
      expect(Array.isArray(splits)).toBe(true);
    });

    it('returns empty array for unknown player', () => {
      const splits = getPlayerDivisionSplits('unknown00');
      expect(splits).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getPlayerLatestSeason
  // ---------------------------------------------------------------------------

  describe('getPlayerLatestSeason', () => {
    it('returns a season ID or undefined for a player', () => {
      const season = getPlayerLatestSeason(TEST_PLAYER_ID);
      if (season != null) {
        expect(typeof season).toBe('string');
        expect(season).toMatch(/^\d{4}-\d{2}$/);
      }
    });

    it('returns null or undefined for unknown player', () => {
      const season = getPlayerLatestSeason('unknown00');
      expect(season == null).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getPlayerSplitSeasons
  // ---------------------------------------------------------------------------

  describe('getPlayerSplitSeasons', () => {
    it('returns an array of seasons for a player', () => {
      const seasons = getPlayerSplitSeasons(TEST_PLAYER_ID);
      expect(Array.isArray(seasons)).toBe(true);
    });

    it('returns empty array for unknown player', () => {
      const seasons = getPlayerSplitSeasons('unknown00');
      expect(seasons).toHaveLength(0);
    });

    it('seasons are ordered newest first when present', () => {
      const seasons = getPlayerSplitSeasons(TEST_PLAYER_ID);
      if (seasons.length < 2) return;
      const first = seasons[0];
      const second = seasons[1];
      if (first === undefined || second === undefined) return;
      expect(first.localeCompare(second)).toBeGreaterThanOrEqual(0);
    });

    it('all season IDs match expected format when present', () => {
      const seasons = getPlayerSplitSeasons(TEST_PLAYER_ID);
      for (const season of seasons) {
        expect(season).toMatch(/^\d{4}-\d{2}$/);
      }
    });
  });
});
