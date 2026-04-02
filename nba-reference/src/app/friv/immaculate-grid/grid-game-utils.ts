import type { CellState, GridCriteria, GridGameState, GridPuzzle } from '@/lib/puzzles/types';

const STORAGE_KEY_PREFIX = 'grid_game_';

export function getCriteriaKey(criteria: GridCriteria): string {
  switch (criteria.type) {
    case 'team':
      return `team:${criteria.teamAbbrev}`;
    case 'award':
      return `award:${criteria.awardName}`;
    case 'stat_ppg':
      return `stat_ppg:${criteria.minValue}`;
    case 'stat_rpg':
      return `stat_rpg:${criteria.minValue}`;
    case 'stat_apg':
      return `stat_apg:${criteria.minValue}`;
    case 'hof':
      return 'hof';
    case 'all_nba':
      return 'all_nba';
  }
}

export function loadGameState(puzzleId: string): GridGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${puzzleId}`);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as GridGameState;
  } catch (_error: unknown) {
    return null;
  }
}

export function saveGameState(state: GridGameState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${state.puzzleId}`, JSON.stringify(state));
  } catch (_error: unknown) {
    return;
  }
}

export function buildInitialState(puzzleId: string): GridGameState {
  return {
    puzzleId,
    cells: {},
    completed: false,
    startedAt: Date.now(),
    completedAt: null,
  };
}

export function buildShareText(puzzle: GridPuzzle, cells: Record<string, CellState>): string {
  const lines: string[] = [`NBA Immaculate Grid - ${puzzle.date}`, ''];
  for (let r = 0; r < puzzle.gridSize; r++) {
    let row = '';
    for (let c = 0; c < puzzle.gridSize; c++) {
      const key = `${r}-${c}`;
      const cell = cells[key];
      if (cell?.submitted !== true) {
        row += '⬛';
      } else if (cell.correct) {
        row += '🟨';
      } else {
        row += '⬜';
      }
    }
    lines.push(row);
  }
  lines.push('');
  lines.push('Play at nba-reference.com/friv/immaculate-grid');
  return lines.join('\n');
}
