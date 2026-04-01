/**
 * @fileoverview Type definitions for the Immaculate Grid basketball trivia game.
 *
 * Defines the data shapes for puzzle criteria, puzzles, and game state used
 * throughout the grid game feature.
 *
 * @module @/lib/puzzles/types
 */

/** A criterion based on a player having played for a specific team */
export interface TeamCriteria {
  type: 'team';
  /** Basketball-Reference team abbreviation (e.g., 'LAL', 'BOS') */
  teamAbbrev: string;
  /** Human-readable label (e.g., 'Los Angeles Lakers') */
  label: string;
}

/** A criterion based on a player winning a specific individual award */
export interface AwardCriteria {
  type: 'award';
  /** Award name as stored in fact_player_award (e.g., 'MVP', 'DPOY', 'ROY') */
  awardName: string;
  /** Human-readable label (e.g., 'NBA MVP') */
  label: string;
}

/** A criterion based on a player averaging X+ points per game in at least one NBA season */
export interface StatPpgCriteria {
  type: 'stat_ppg';
  /** Minimum points per game threshold */
  minValue: number;
  /** Human-readable label (e.g., '20+ PPG Season') */
  label: string;
}

/** A criterion based on a player averaging X+ rebounds per game in at least one NBA season */
export interface StatRpgCriteria {
  type: 'stat_rpg';
  /** Minimum rebounds per game threshold */
  minValue: number;
  /** Human-readable label (e.g., '10+ RPG Season') */
  label: string;
}

/** A criterion based on a player averaging X+ assists per game in at least one NBA season */
export interface StatApgCriteria {
  type: 'stat_apg';
  /** Minimum assists per game threshold */
  minValue: number;
  /** Human-readable label (e.g., '10+ APG Season') */
  label: string;
}

/** A criterion based on a player being enshrined in the Basketball Hall of Fame */
export interface HofCriteria {
  type: 'hof';
  /** Human-readable label */
  label: string;
}

/** A criterion based on a player receiving at least one All-NBA team selection */
export interface AllNbaCriteria {
  type: 'all_nba';
  /** Human-readable label */
  label: string;
}

/** Union of all supported criteria types */
export type GridCriteria =
  | TeamCriteria
  | AwardCriteria
  | StatPpgCriteria
  | StatRpgCriteria
  | StatApgCriteria
  | HofCriteria
  | AllNbaCriteria;

/** A single grid puzzle definition */
export interface GridPuzzle {
  /** Unique identifier (e.g., '2025-03-31') */
  puzzleId: string;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Grid dimension — 3 produces a 3×3 grid */
  gridSize: 3;
  /** Row criteria (length must equal gridSize) */
  rows: GridCriteria[];
  /** Column criteria (length must equal gridSize) */
  cols: GridCriteria[];
}

/** Serialisable representation of a single cell's state */
export interface CellState {
  /** User's entered player name */
  playerName: string;
  /** Basketball-Reference player ID (after validation) */
  brefId: string | null;
  /** Whether the cell has been validated as correct */
  correct: boolean;
  /** Whether the user has submitted a guess for this cell */
  submitted: boolean;
}

/** Full game state stored in localStorage */
export interface GridGameState {
  /** ID of the puzzle being played */
  puzzleId: string;
  /** Cell states indexed by "rowIndex-colIndex" */
  cells: Record<string, CellState>;
  /** Whether the game has been completed */
  completed: boolean;
  /** Timestamp (ms) when the puzzle was started */
  startedAt: number;
  /** Timestamp (ms) when the puzzle was completed, if applicable */
  completedAt: number | null;
}

/** API response for GET /api/grid/today */
export interface TodayPuzzleResponse {
  puzzle: GridPuzzle;
}

/** Request body for POST /api/grid/answer */
export interface AnswerRequest {
  puzzleId: string;
  rowIndex: number;
  colIndex: number;
  brefId: string;
}

/** API response for POST /api/grid/answer */
export interface AnswerResponse {
  correct: boolean;
  brefId: string | null;
  fullName: string | null;
  message: string;
}

/** API response for GET /api/grid/history */
export interface HistoryResponse {
  puzzles: GridPuzzle[];
}
