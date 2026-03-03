/**
 * @fileoverview Unit tests for query helper functions.
 *
 * Tests domain-specific queries across players, teams, and games:
 * - Team lookups by abbreviation
 * - Team season statistics
 * - Team roster retrieval
 * - Player lookups by Basketball-Reference ID
 * - Player season stats (various formats)
 * - Per-100 possession calculations
 * - Adjusted shooting metrics
 * - Player metadata and game highs
 * - Game box scores
 *
 * Uses LeBron James (jamesle01) as a known test player and
 * Lakers (LAL) / Knicks (NYK) as known test teams.
 *
 * @module @/lib/queries/index.test
 */

import { describe, expect, it } from 'vitest';
import {
  getGameById,
  getPlayerPer100Stats,
  getPlayerAdjustedShootingStats,
  getPlayerByBrefId,
  getPlayerGameHighs,
  getPlayerSeasonStats,
  getTeamByAbbrev,
  getTeamGameBox,
  getTeamRoster,
  getTeamSeasonStats,
} from './index';

describe('query helpers', () => {
  /**
   * Verifies that getTeamByAbbrev correctly finds the Lakers.
   * Tests exact abbreviation matching.
   */
  it('finds known teams', () => {
    const lakers = getTeamByAbbrev('LAL');
    expect(lakers).toBeTruthy();
    expect(lakers?.abbreviation).toBe('LAL');
  });

  /**
   * Verifies that getTeamSeasonStats returns season data for a team.
   * Checks for expected properties on returned rows.
   */
  it('returns team season stats when available', () => {
    const rows = getTeamSeasonStats('LAL');
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty('season_id');
  });

  /**
   * Verifies that getTeamRoster returns player rows for a team.
   * Uses NYK (Knicks) as a test case.
   */
  it('returns team roster rows', () => {
    const team = getTeamByAbbrev('NYK');
    expect(team).toBeTruthy();
    const roster = getTeamRoster(team!.team_id);
    expect(Array.isArray(roster)).toBe(true);
  });

  /**
   * Verifies that getPlayerByBrefId finds a known player.
   * Uses LeBron James (jamesle01) as the test case.
   */
  it('finds known player by bref id', () => {
    const player = getPlayerByBrefId('jamesle01');
    expect(player).toBeTruthy();
    expect(player?.full_name.toLowerCase()).toContain('james');
  });

  /**
   * Verifies that getPlayerSeasonStats returns season stats rows.
   * Tests with LeBron James.
   */
  it('returns player season stats rows', () => {
    const stats = getPlayerSeasonStats('jamesle01', 3);
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
  });

  /**
   * Verifies that per-100 stats are calculated in a realistic range.
   * Points per 100 possessions should typically be between 5-70.
   */
  it('returns realistic per-100 values', () => {
    const rows = getPlayerPer100Stats('jamesle01', 1);
    expect(rows.length).toBeGreaterThan(0);
    const pts100 = Number(rows[0].pts_100);
    expect(Number.isNaN(pts100)).toBe(false);
    expect(pts100).toBeGreaterThan(5);
    expect(pts100).toBeLessThan(70);
  });

  /**
   * Verifies that adjusted shooting stats include league-relative metrics.
   * Checks for eFG+ and TS+ which compare player to league average.
   */
  it('returns adjusted shooting rows with plus metrics', () => {
    const rows = getPlayerAdjustedShootingStats('jamesle01', 1);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty('efg_plus');
    expect(rows[0]).toHaveProperty('ts_plus');
  });

  /**
   * Verifies that player records include metadata like active status.
   */
  it('returns player metadata including active status', () => {
    const player = getPlayerByBrefId('jamesle01') as Record<string, unknown> | undefined;
    expect(player).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(player ?? {}, 'is_active')).toBe(true);
  });

  /**
   * Verifies that game highs include expanded stat categories.
   * Tests for minutes played, field goal attempts, and plus/minus.
   */
  it('returns expanded game highs including minutes and shooting', () => {
    const player = getPlayerByBrefId('jamesle01');
    expect(player).toBeTruthy();
    const highs = getPlayerGameHighs(player!.player_id) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(highs, 'mp')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(highs, 'fga')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(highs, 'plus_minus')).toBe(true);
  });

  /**
   * Verifies that game box scores can be retrieved for a known game.
   * Falls back to current season game ID if previous season not available.
   */
  it('returns game box for a known game', () => {
    const game = getGameById('0022300001') ?? getGameById('0022400001');
    expect(game).toBeTruthy();
    const box = getTeamGameBox(game!.game_id as string);
    expect(Array.isArray(box)).toBe(true);
    expect(box.length).toBeGreaterThan(0);
  });
});
