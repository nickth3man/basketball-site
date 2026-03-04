import { describe, expect, it } from 'vitest';
import {
  getPlayerByBrefId,
  getPlayerSeasonStats,
  getPlayerPer36Stats,
  getPlayerPer100Stats,
  getPlayerPerGameStats,
  getPlayerAdvancedSeasonStats,
  getPlayerCareerSummary,
  getPlayerCareerTotals,
} from '@/lib/queries/players';

describe('player queries', () => {
  const TEST_PLAYER_ID = 'jamesle01';

  describe('getPlayerByBrefId', () => {
    it('finds a known player', () => {
      const player = getPlayerByBrefId(TEST_PLAYER_ID);
      expect(player).toBeTruthy();
      expect(player?.full_name.toLowerCase()).toContain('james');
      expect(player?.bref_id).toBe(TEST_PLAYER_ID);
    });

    it('returns undefined for unknown player', () => {
      const player = getPlayerByBrefId('unknown00');
      expect(player).toBeUndefined();
    });

    it('returns player with required fields', () => {
      const player = getPlayerByBrefId(TEST_PLAYER_ID);
      expect(player).toHaveProperty('player_id');
      expect(player).toHaveProperty('full_name');
      expect(player).toHaveProperty('position');
    });
  });

  describe('getPlayerSeasonStats', () => {
    it('returns season stats array', () => {
      const stats = getPlayerSeasonStats(TEST_PLAYER_ID);
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
    });

    it('returns stats with required fields', () => {
      const stats = getPlayerSeasonStats(TEST_PLAYER_ID, 1);
      const first = stats[0];
      expect(first).toHaveProperty('season_id');
      expect(first).toHaveProperty('pts');
      expect(first).toHaveProperty('g');
    });

    it('respects limit parameter', () => {
      const stats = getPlayerSeasonStats(TEST_PLAYER_ID, 3);
      expect(stats.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getPlayerPer36Stats', () => {
    it('returns per-36 stats array', () => {
      const stats = getPlayerPer36Stats(TEST_PLAYER_ID);
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
    });

    it('includes calculated per-36 fields', () => {
      const stats = getPlayerPer36Stats(TEST_PLAYER_ID, 1);
      const first = stats[0];
      expect(first).toHaveProperty('pts_36');
      expect(first).toHaveProperty('reb_36');
      expect(first).toHaveProperty('ast_36');
    });
  });

  describe('getPlayerPer100Stats', () => {
    it('returns per-100 stats array', () => {
      const stats = getPlayerPer100Stats(TEST_PLAYER_ID);
      expect(Array.isArray(stats)).toBe(true);
    });

    it('includes calculated per-100 fields', () => {
      const stats = getPlayerPer100Stats(TEST_PLAYER_ID, 1);
      expect(stats.length).toBeGreaterThan(0);
      const first = stats[0];
      if (first === undefined) throw new Error('Expected non-empty per-100 stats');
      expect(first).toHaveProperty('pts_100');
      expect(first).toHaveProperty('reb_100');
    });
  });

  describe('getPlayerPerGameStats', () => {
    it('returns per-game stats array', () => {
      const stats = getPlayerPerGameStats(TEST_PLAYER_ID);
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
    });

    it('includes per-game averages', () => {
      const stats = getPlayerPerGameStats(TEST_PLAYER_ID, 1);
      const first = stats[0];
      expect(first).toHaveProperty('pts_pg');
      expect(first).toHaveProperty('reb_pg');
      expect(first).toHaveProperty('ast_pg');
    });
  });

  describe('getPlayerAdvancedSeasonStats', () => {
    it('returns advanced stats array', () => {
      const stats = getPlayerAdvancedSeasonStats(TEST_PLAYER_ID);
      expect(Array.isArray(stats)).toBe(true);
    });

    it('includes advanced metrics when available', () => {
      const stats = getPlayerAdvancedSeasonStats(TEST_PLAYER_ID, 1);
      if (stats.length > 0) {
        const first = stats[0];
        expect(first).toHaveProperty('per');
        expect(first).toHaveProperty('ws');
        expect(first).toHaveProperty('vorp');
      }
    });
  });

  describe('getPlayerCareerSummary', () => {
    it('returns career summary object', () => {
      const summary = getPlayerCareerSummary(TEST_PLAYER_ID);
      expect(summary).toBeTruthy();
      expect(summary).toHaveProperty('g');
      expect(summary).toHaveProperty('pts_pg');
    });
  });

  describe('getPlayerCareerTotals', () => {
    it('returns career totals object', () => {
      const totals = getPlayerCareerTotals(TEST_PLAYER_ID);
      expect(totals).toBeTruthy();
      expect(totals).toHaveProperty('pts');
      expect(totals).toHaveProperty('g');
    });
  });
});
