/**
 * @fileoverview Interactive Immaculate Grid game component.
 *
 * Client-side component that:
 * - Renders the 3×3 grid with row/column criteria headers
 * - Manages cell input via a modal/dialog with player-name autocomplete
 * - Validates answers via POST /api/grid/answer
 * - Persists game state to localStorage
 * - Displays a share sheet on completion
 *
 * @module @/app/friv/immaculate-grid/GridGame
 */

'use client';

import type { JSX } from 'react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AnswerResponse,
  CellState,
  GridCriteria,
  GridGameState,
  GridPuzzle,
} from '@/lib/puzzles/types';
import { CellDialog, ShareOverlay } from './grid-game-dialog';
import {
  buildInitialState,
  buildShareText,
  getCriteriaKey,
  loadGameState,
  saveGameState,
} from './grid-game-utils';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single criteria badge shown in row/column headers */
function CriteriaLabel({ criteria }: { criteria: GridCriteria }): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center p-2 text-center text-xs leading-tight font-semibold text-[var(--dc-on-primary)] sm:text-sm">
      {criteria.label}
    </div>
  );
}

interface CellProps {
  rowIndex: number;
  colIndex: number;
  state: CellState | undefined;
  onClick: (row: number, col: number) => void;
}

/** An individual grid cell that shows correctness feedback */
function GridCell({ rowIndex, colIndex, state, onClick }: CellProps): JSX.Element {
  const isEmpty = state?.submitted !== true;
  const isCorrect = state?.correct === true;
  const isWrong = state?.submitted === true && !state.correct;
  const playerName = state?.playerName ?? '';

  const handleClick = useCallback((): void => {
    onClick(rowIndex, colIndex);
  }, [onClick, rowIndex, colIndex]);

  let cellClass =
    'flex h-full min-h-[4.5rem] w-full cursor-pointer items-center justify-center rounded p-2 text-center text-xs font-medium transition-all duration-200 sm:min-h-[5.5rem] sm:text-sm';

  if (isCorrect) {
    cellClass +=
      ' bg-[color-mix(in_srgb,var(--dc-tertiary-container)_30%,var(--dc-surface-container-highest))] shadow-[var(--shadow-glow-gold)] ring-1 ring-[color-mix(in_srgb,var(--dc-tertiary)_55%,transparent)]';
  } else if (isWrong) {
    cellClass +=
      ' bg-[color-mix(in_srgb,var(--dc-secondary-container)_20%,var(--dc-surface-container-highest))] ring-1 ring-[color-mix(in_srgb,var(--dc-secondary)_40%,transparent)]';
  } else {
    cellClass +=
      ' surface-altar hover:bg-[color-mix(in_srgb,var(--dc-surface-container-highest)_90%,var(--dc-tertiary)_10%)] hover:shadow-[var(--shadow-glow-gold)]';
  }

  const ariaLabel = isCorrect
    ? `Correct: ${playerName}`
    : isWrong
      ? `Incorrect: ${playerName} — click to try again`
      : 'Empty cell — click to enter a player';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isCorrect}
      aria-label={ariaLabel}
      className={cellClass}
    >
      {isEmpty ? (
        <span className="text-[var(--dc-outline-variant)]">+</span>
      ) : (
        <span className={isCorrect ? 'text-[var(--dc-tertiary)]' : 'text-[var(--dc-secondary)]'}>
          {playerName}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main GridGame component
// ---------------------------------------------------------------------------

interface GridGameProps {
  puzzle: GridPuzzle;
}

/**
 * Interactive Immaculate Grid game.
 *
 * Renders a 3×3 grid with criteria headers, handles cell input, validates
 * answers via the API, and persists game state to localStorage.
 *
 * @param puzzle - The puzzle to render
 */
export function GridGame({ puzzle }: GridGameProps): JSX.Element {
  const { puzzleId, gridSize, rows, cols } = puzzle;

  // Initialise or restore game state
  const [gameState, setGameState] = useState<GridGameState>(() => {
    const saved = loadGameState(puzzleId);
    return saved ?? buildInitialState(puzzleId);
  });

  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [showShare, setShowShare] = useState(false);

  // Persist state whenever it changes
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Count correct cells
  const correctCount = useMemo(() => {
    return Object.values(gameState.cells).filter(c => c.correct).length;
  }, [gameState.cells]);

  const totalCells = gridSize * gridSize;

  const handleCellClick = useCallback(
    (row: number, col: number): void => {
      const key = `${row}-${col}`;
      const cell = gameState.cells[key];
      if (cell?.correct === true) return; // locked once correct
      setActiveCell({ row, col });
    },
    [gameState.cells]
  );

  const handleResult = useCallback(
    (row: number, col: number, result: AnswerResponse, playerName: string): void => {
      const key = `${row}-${col}`;
      const newCell: CellState = {
        playerName: result.fullName ?? playerName,
        brefId: result.brefId,
        correct: result.correct,
        submitted: true,
      };

      setGameState(prev => {
        const updatedCells = { ...prev.cells, [key]: newCell };
        const newCorrectCount = Object.values(updatedCells).filter(c => c.correct).length;
        const completed = newCorrectCount === totalCells;
        return {
          ...prev,
          cells: updatedCells,
          completed,
          completedAt: completed && prev.completedAt === null ? Date.now() : prev.completedAt,
        };
      });

      // Show share overlay when this answer completes the grid
      if (result.correct) {
        const currentCorrect = Object.values(gameState.cells).filter(c => c.correct).length;
        if (currentCorrect + 1 === totalCells) {
          setShowShare(true);
        }
      }
    },
    [totalCells, gameState.cells]
  );

  const shareText = useMemo(
    () => buildShareText(puzzle, gameState.cells),
    [puzzle, gameState.cells]
  );

  const activeRow = activeCell !== null ? rows[activeCell.row] : undefined;
  const activeCol = activeCell !== null ? cols[activeCell.col] : undefined;

  return (
    <div className="relative">
      {/* Score bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {correctCount}/{totalCells} correct
        </p>
        {correctCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setShowShare(true);
            }}
            className="rounded-md bg-[var(--dc-tertiary)] px-3 py-1.5 text-xs font-semibold text-[var(--dc-on-tertiary-fixed)] transition-opacity hover:opacity-90"
          >
            Share
          </button>
        )}
      </div>

      {/* Grid */}
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${gridSize + 1}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {/* Top-left empty corner */}
        <div className="min-h-[2.5rem]" />

        {/* Column headers */}
        {cols.map(col => (
          <div
            key={getCriteriaKey(col)}
            className="fresco-hero min-h-[2.5rem] rounded p-1 text-center text-xs leading-tight font-semibold text-[var(--dc-on-primary)] sm:text-sm"
          >
            <CriteriaLabel criteria={col} />
          </div>
        ))}

        {/* Rows */}
        {rows.map((row, ri) => {
          const rowKey = getCriteriaKey(row);

          return (
            <Fragment key={rowKey}>
              {/* Row header */}
              <div className="fresco-hero flex min-h-[4.5rem] items-center justify-center rounded p-1 sm:min-h-[5.5rem]">
                <CriteriaLabel criteria={row} />
              </div>

              {/* Cells */}
              {cols.map((col, ci) => (
                <GridCell
                  key={`${rowKey}-${getCriteriaKey(col)}`}
                  rowIndex={ri}
                  colIndex={ci}
                  state={gameState.cells[`${ri}-${ci}`]}
                  onClick={handleCellClick}
                />
              ))}
            </Fragment>
          );
        })}
      </div>

      {/* Cell input dialog */}
      {activeCell !== null && activeRow !== undefined && activeCol !== undefined && (
        <CellDialog
          rowIndex={activeCell.row}
          colIndex={activeCell.col}
          rowCriteria={activeRow}
          colCriteria={activeCol}
          puzzleId={puzzleId}
          onClose={() => {
            setActiveCell(null);
          }}
          onResult={handleResult}
        />
      )}

      {/* Share overlay */}
      {showShare && (
        <ShareOverlay
          shareText={shareText}
          onClose={() => {
            setShowShare(false);
          }}
        />
      )}
    </div>
  );
}
