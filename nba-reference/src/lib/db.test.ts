/**
 * @fileoverview Unit tests for database utilities and query functions.
 *
 * Tests the core database layer and query modules to ensure:
 * - Season ID format is valid
 * - Standings queries return expected data structure
 * - Game queries return valid game records
 * - Search functionality finds entities correctly
 *
 * @module @/lib/db.test
 */

import { describe, expect, it, vi } from 'vitest';
import { clearQueryCache, getCachedQueryMany, getDb, getLatestSeasonId } from '@/lib/db';
import { getHomeStandings, getRecentGames } from '@/lib/query/home';
import { searchEntities } from '@/lib/query/search';

describe('db utilities', () => {
  /**
   * Verifies that getLatestSeasonId returns a valid season ID format.
   * Season IDs follow the pattern "YYYY-YY" (e.g., "2024-25").
   */
  it('returns a latest season id', () => {
    const seasonId = getLatestSeasonId();
    expect(seasonId).toMatch(/^\d{4}-\d{2}$/);
  });

  /**
   * Verifies that getHomeStandings returns valid standings data.
   * Checks for presence of expected properties on returned rows.
   */
  it('returns standings rows', () => {
    const rows = getHomeStandings(5);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty('bref_abbrev');
    expect(rows[0]).toHaveProperty('w');
    expect(rows[0]).toHaveProperty('l');
  });

  /**
   * Verifies that getRecentGames returns valid game records.
   * Games should have game_id and team abbreviations.
   */
  it('returns recent finished games', () => {
    const games = getRecentGames(5);
    expect(games.length).toBeGreaterThan(0);
    expect(games[0]).toHaveProperty('game_id');
    expect(games[0]).toHaveProperty('home_abbrev');
    expect(games[0]).toHaveProperty('away_abbrev');
  });

  /**
   * Verifies that searchEntities finds players and/or teams.
   * Searches for "laker" which should match the Lakers team.
   */
  it('search finds players and/or teams', () => {
    const results = searchEntities('laker');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('type');
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('label');
    expect(results[0]).toHaveProperty('href');
  });

  it('honors helper cache TTLs without statement-level overlap', () => {
    vi.useFakeTimers();
    clearQueryCache();

    const db = getDb();
    const prepareSpy = vi.spyOn(db, 'prepare');
    const sql = 'SELECT season_id FROM dim_season ORDER BY start_year DESC LIMIT ?';

    getCachedQueryMany<Array<{ season_id: string }>>(sql, [1], 1_000);
    getCachedQueryMany<Array<{ season_id: string }>>(sql, [1], 1_000);
    expect(prepareSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1_001);
    getCachedQueryMany<Array<{ season_id: string }>>(sql, [1], 1_000);
    expect(prepareSpy).toHaveBeenCalledTimes(2);

    clearQueryCache();
  });
});
