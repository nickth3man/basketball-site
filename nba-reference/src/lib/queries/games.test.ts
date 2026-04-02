import { describe, expect, it } from 'vitest';
import {
  getGameById,
  getGamePlayerBoxScore,
  getGamePlayerAdvancedBoxScore,
  getGameTeamFourFactors,
  getGameLineScore,
  getGameTeamBoxScores,
  getGamePbpWithShotDetails,
} from '@/lib/queries/games';

describe('game queries', () => {
  const TEST_GAME_ID = '0022401228';

  describe('getGameById', () => {
    it('finds a known game', () => {
      const game = getGameById(TEST_GAME_ID);
      expect(game).toBeTruthy();
      expect(game).toHaveProperty('game_id');
      expect(game).toHaveProperty('game_date');
    });

    it('returns undefined for unknown game', () => {
      const game = getGameById('unknown999');
      expect(game).toBeUndefined();
    });

    it('returns game with team info', () => {
      const game = getGameById(TEST_GAME_ID);
      expect(game).toHaveProperty('home_abbrev');
      expect(game).toHaveProperty('away_abbrev');
      expect(game).toHaveProperty('home_score');
      expect(game).toHaveProperty('away_score');
    });
  });

  describe('getGamePlayerBoxScore', () => {
    it('returns player box scores', () => {
      const box = getGamePlayerBoxScore(TEST_GAME_ID);
      expect(Array.isArray(box)).toBe(true);
    });

    it('includes player stats', () => {
      const box = getGamePlayerBoxScore(TEST_GAME_ID);
      expect(box.length).toBeGreaterThan(0);
      const player = box[0];
      if (player === undefined) throw new Error('Expected non-empty box score');
      expect(player).toHaveProperty('full_name');
      expect(player).toHaveProperty('pts');
      expect(player).toHaveProperty('reb');
      expect(player).toHaveProperty('ast');
    });
  });

  describe('getGamePlayerAdvancedBoxScore', () => {
    it('returns advanced box scores', () => {
      const box = getGamePlayerAdvancedBoxScore(TEST_GAME_ID);
      expect(Array.isArray(box)).toBe(true);
    });

    it('includes advanced metrics', () => {
      const box = getGamePlayerAdvancedBoxScore(TEST_GAME_ID);
      expect(box.length).toBeGreaterThan(0);
      const player = box[0];
      if (player === undefined) throw new Error('Expected non-empty advanced box score');
      expect(player).toHaveProperty('game_score');
      expect(player).toHaveProperty('efg_pct');
      expect(player).toHaveProperty('ts_pct');
    });
  });

  describe('getGameTeamBoxScores', () => {
    it('returns team box scores', () => {
      const box = getGameTeamBoxScores(TEST_GAME_ID);
      expect(Array.isArray(box)).toBe(true);
      expect(box.length).toBe(2);
    });
  });

  describe('getGameTeamFourFactors', () => {
    it('returns four factors for both teams', () => {
      const factors = getGameTeamFourFactors(TEST_GAME_ID);
      expect(Array.isArray(factors)).toBe(true);
      expect(factors.length).toBe(2);
    });

    it('includes four factors metrics', () => {
      const factors = getGameTeamFourFactors(TEST_GAME_ID);
      const team = factors[0];
      expect(team).toHaveProperty('efg_pct');
      expect(team).toHaveProperty('tov_pct');
      expect(team).toHaveProperty('orb_pct');
      expect(team).toHaveProperty('ft_fga');
    });
  });

  describe('getGameLineScore', () => {
    it('returns line score by period', () => {
      const lineScore = getGameLineScore(TEST_GAME_ID);
      expect(Array.isArray(lineScore)).toBe(true);
    });

    it('includes period scoring', () => {
      const lineScore = getGameLineScore(TEST_GAME_ID);
      if (lineScore.length > 0) {
        const period = lineScore[0];
        expect(period).toHaveProperty('period');
        expect(period).toHaveProperty('home');
        expect(period).toHaveProperty('away');
      }
    });
  });

  describe('getGamePbpWithShotDetails', () => {
    it('returns an array', () => {
      const shots = getGamePbpWithShotDetails(TEST_GAME_ID);
      expect(Array.isArray(shots)).toBe(true);
    });

    it('only returns made or missed field goal events', () => {
      const shots = getGamePbpWithShotDetails(TEST_GAME_ID);
      for (const shot of shots) {
        expect([1, 2]).toContain(shot.eventmsgtype);
      }
    });

    it('includes required ShotEvent fields', () => {
      const shots = getGamePbpWithShotDetails(TEST_GAME_ID);
      if (shots.length === 0) return; // graceful if game has no shot data
      const shot = shots[0];
      expect(shot).toHaveProperty('event_id');
      expect(shot).toHaveProperty('period');
      expect(shot).toHaveProperty('shot_result');
      expect(shot).toHaveProperty('shot_type');
      expect(shot).toHaveProperty('shot_zone');
      expect(shot).toHaveProperty('assisted');
      expect(shot).toHaveProperty('shot_value');
    });

    it('shot_result matches eventmsgtype', () => {
      const shots = getGamePbpWithShotDetails(TEST_GAME_ID);
      for (const shot of shots) {
        if (shot.eventmsgtype === 1) {
          expect(shot.shot_result).toBe('made');
        } else {
          expect(shot.shot_result).toBe('missed');
        }
      }
    });

    it('respects limit parameter', () => {
      const shots = getGamePbpWithShotDetails(TEST_GAME_ID, 5);
      expect(shots.length).toBeLessThanOrEqual(5);
    });

    it('returns empty array for unknown game', () => {
      const shots = getGamePbpWithShotDetails('unknown999');
      expect(shots).toHaveLength(0);
    });

    it('shot_value is 2 or 3 when present', () => {
      const shots = getGamePbpWithShotDetails(TEST_GAME_ID);
      for (const shot of shots) {
        if (shot.shot_value !== null) {
          expect([2, 3]).toContain(shot.shot_value);
        }
      }
    });
  });
});
