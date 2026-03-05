import { describe, expect, it } from 'vitest';
import { searchEntities } from '@/lib/query/search';
import {
  getPlayerDirectory,
  getPlayerDirectoryByLetter,
  getTeamDirectory,
} from '@/lib/query/directory';
import {
  getLatestCompletedGameDate,
  getPreviousCompletedGameDate,
  getNextCompletedGameDate,
  getCompletedGamesByDate,
} from '@/lib/query/boxscores';
import { getHomeSeasonId, getHomeStandings, getRecentGames } from '@/lib/query/home';

describe('feature query modules', () => {
  it('searchEntities enforces minimum query length and returns mixed entities', () => {
    expect(searchEntities('a')).toEqual([]);

    const results = searchEntities('james');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(12);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('type');
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('label');
    }
  });

  it('directory queries return expected structures', () => {
    const players = getPlayerDirectory(10);
    expect(players.length).toBeLessThanOrEqual(10);
    if (players.length > 0) {
      expect(players[0]).toHaveProperty('bref_id');
      expect(players[0]).toHaveProperty('full_name');
    }

    const letterPlayers = getPlayerDirectoryByLetter('j', 10);
    expect(Array.isArray(letterPlayers)).toBe(true);
    expect(getPlayerDirectoryByLetter('1', 10)).toEqual([]);

    const teams = getTeamDirectory();
    expect(Array.isArray(teams)).toBe(true);
    expect(teams.length).toBeGreaterThan(0);
    expect(teams[0]).toHaveProperty('abbreviation');
  });

  it('boxscore date helpers return coherent date navigation', () => {
    const latest = getLatestCompletedGameDate();
    expect(latest).toBeTruthy();
    if (latest == null) return;

    const byDate = getCompletedGamesByDate(latest);
    expect(Array.isArray(byDate)).toBe(true);

    const previous = getPreviousCompletedGameDate(latest);
    if (previous != null) {
      expect(previous <= latest).toBe(true);
      const previousGames = getCompletedGamesByDate(previous);
      expect(Array.isArray(previousGames)).toBe(true);
    }

    const next = getNextCompletedGameDate(latest);
    expect(next).toBeNull();
  });

  it('home queries return valid season, standings, and games', () => {
    const seasonId = getHomeSeasonId();
    expect(typeof seasonId).toBe('string');
    expect(seasonId.length).toBe(7);

    const standings = getHomeStandings(10);
    expect(standings.length).toBeLessThanOrEqual(10);
    if (standings.length > 0) {
      expect(standings[0]).toHaveProperty('bref_abbrev');
      expect(standings[0]).toHaveProperty('w');
    }

    const recentGames = getRecentGames(10);
    expect(recentGames.length).toBeLessThanOrEqual(10);
    if (recentGames.length > 0) {
      expect(recentGames[0]).toHaveProperty('game_id');
      expect(recentGames[0]).toHaveProperty('home_abbrev');
    }
  });
});
