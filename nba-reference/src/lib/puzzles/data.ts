/**
 * @fileoverview Static puzzle definitions for the Immaculate Grid game.
 *
 * Puzzles are curated manually and identified by YYYY-MM-DD date strings.
 * Each puzzle defines three row criteria and three column criteria; a valid
 * answer for a cell must satisfy BOTH the row and column criterion for that cell.
 *
 * Answer validation is performed dynamically against the live NBA database —
 * these objects only declare the criteria, not the accepted player list.
 *
 * @module @/lib/puzzles/data
 */

import type { GridPuzzle } from './types';

/**
 * All available puzzles, sorted by date ascending.
 * The game serves today's puzzle by matching `puzzle.date` to the current ET date.
 */
export const PUZZLES: GridPuzzle[] = [
  {
    puzzleId: '2025-03-31',
    date: '2025-03-31',
    gridSize: 3,
    rows: [
      { type: 'team', teamAbbrev: 'LAL', label: 'Los Angeles Lakers' },
      { type: 'team', teamAbbrev: 'SAS', label: 'San Antonio Spurs' },
      { type: 'team', teamAbbrev: 'BOS', label: 'Boston Celtics' },
    ],
    cols: [
      { type: 'award', awardName: 'MVP', label: 'NBA MVP' },
      { type: 'stat_ppg', minValue: 20, label: '20+ PPG Season' },
      { type: 'hof', label: 'Hall of Fame' },
    ],
  },
  {
    puzzleId: '2025-04-01',
    date: '2025-04-01',
    gridSize: 3,
    rows: [
      { type: 'team', teamAbbrev: 'CHI', label: 'Chicago Bulls' },
      { type: 'team', teamAbbrev: 'MIA', label: 'Miami Heat' },
      { type: 'team', teamAbbrev: 'GSW', label: 'Golden State Warriors' },
    ],
    cols: [
      { type: 'award', awardName: 'MVP', label: 'NBA MVP' },
      { type: 'award', awardName: 'DPOY', label: 'NBA DPOY' },
      { type: 'stat_rpg', minValue: 10, label: '10+ RPG Season' },
    ],
  },
  {
    puzzleId: '2025-04-02',
    date: '2025-04-02',
    gridSize: 3,
    rows: [
      { type: 'team', teamAbbrev: 'NYK', label: 'New York Knicks' },
      { type: 'team', teamAbbrev: 'HOU', label: 'Houston Rockets' },
      { type: 'team', teamAbbrev: 'DET', label: 'Detroit Pistons' },
    ],
    cols: [
      { type: 'stat_ppg', minValue: 20, label: '20+ PPG Season' },
      { type: 'stat_apg', minValue: 10, label: '10+ APG Season' },
      { type: 'hof', label: 'Hall of Fame' },
    ],
  },
  {
    puzzleId: '2025-04-03',
    date: '2025-04-03',
    gridSize: 3,
    rows: [
      { type: 'team', teamAbbrev: 'LAL', label: 'Los Angeles Lakers' },
      { type: 'team', teamAbbrev: 'BOS', label: 'Boston Celtics' },
      { type: 'team', teamAbbrev: 'DET', label: 'Detroit Pistons' },
    ],
    cols: [
      { type: 'stat_ppg', minValue: 20, label: '20+ PPG Season' },
      { type: 'award', awardName: 'ROY', label: 'NBA ROY' },
      { type: 'all_nba', label: 'All-NBA Selection' },
    ],
  },
  {
    puzzleId: '2025-04-04',
    date: '2025-04-04',
    gridSize: 3,
    rows: [
      { type: 'team', teamAbbrev: 'LAL', label: 'Los Angeles Lakers' },
      { type: 'team', teamAbbrev: 'GSW', label: 'Golden State Warriors' },
      { type: 'team', teamAbbrev: 'SAS', label: 'San Antonio Spurs' },
    ],
    cols: [
      { type: 'stat_ppg', minValue: 25, label: '25+ PPG Season' },
      { type: 'hof', label: 'Hall of Fame' },
      { type: 'award', awardName: 'MVP', label: 'NBA MVP' },
    ],
  },
];

/**
 * Return the puzzle for a given YYYY-MM-DD date string, or `undefined` if none exists.
 *
 * @param date - ISO date string (YYYY-MM-DD) representing the target date
 * @returns The matching puzzle, or `undefined`
 */
export function getPuzzleByDate(date: string): GridPuzzle | undefined {
  return PUZZLES.find(p => p.date === date);
}

/**
 * Return the most-recent puzzle on or before `date`.
 * Falls back to the latest available puzzle when no exact match exists.
 *
 * @param date - ISO date string (YYYY-MM-DD) representing today
 * @returns The active puzzle, or `undefined` if no puzzles exist
 */
export function getTodayPuzzle(date: string): GridPuzzle | undefined {
  const exact = getPuzzleByDate(date);
  if (exact !== undefined) return exact;

  // Fall back to the most recent puzzle that is not in the future
  const past = PUZZLES.filter(p => p.date <= date).sort((a, b) => b.date.localeCompare(a.date));
  return past[0];
}

/**
 * Return all puzzles that are on or before `date`, sorted newest-first.
 *
 * @param date - ISO date string (YYYY-MM-DD) representing today
 * @returns Array of available puzzles
 */
export function getAvailablePuzzles(date: string): GridPuzzle[] {
  return PUZZLES.filter(p => p.date <= date).sort((a, b) => b.date.localeCompare(a.date));
}
