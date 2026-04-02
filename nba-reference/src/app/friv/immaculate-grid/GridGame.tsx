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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AnswerResponse,
  CellState,
  GridCriteria,
  GridGameState,
  GridPuzzle,
} from '@/lib/puzzles/types';

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = 'grid_game_';

function loadGameState(puzzleId: string): GridGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${puzzleId}`);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as GridGameState;
  } catch {
    return null;
  }
}

function saveGameState(state: GridGameState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${state.puzzleId}`, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable in private browsing
  }
}

function buildInitialState(puzzleId: string): GridGameState {
  return {
    puzzleId,
    cells: {},
    completed: false,
    startedAt: Date.now(),
    completedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Share helper
// ---------------------------------------------------------------------------

function buildShareText(puzzle: GridPuzzle, cells: Record<string, CellState>): string {
  const lines: string[] = [`NBA Immaculate Grid — ${puzzle.date}`, ''];
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
// Player autocomplete
// ---------------------------------------------------------------------------

interface PlayerSuggestion {
  id: string;
  label: string;
}

interface PlayerSearchResult {
  id: string;
  label: string;
  type: string;
}

interface SearchApiResponse {
  results: PlayerSearchResult[];
}

function usePlayerSearch(
  query: string,
  enabled: boolean
): {
  suggestions: PlayerSuggestion[];
} {
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    if (!enabled || query.trim().length < 2) {
      return;
    }
    timerRef.current = setTimeout(() => {
      void fetch(`/api/search?q=${encodeURIComponent(query.trim())}&type=player`)
        .then(r => r.json() as Promise<SearchApiResponse>)
        .then(data => {
          const players = data.results.filter((r: PlayerSearchResult) => r.type === 'player');
          setSuggestions(players.map((r: PlayerSearchResult) => ({ id: r.id, label: r.label })));
        })
        .catch(() => {
          setSuggestions([]);
        });
    }, 250);

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [query, enabled]);

  // Only surface suggestions when the input is long enough and the search is active
  const displayedSuggestions = enabled && query.trim().length >= 2 ? suggestions : [];

  return { suggestions: displayedSuggestions };
}

// ---------------------------------------------------------------------------
// Cell input dialog
// ---------------------------------------------------------------------------

interface CellDialogProps {
  rowIndex: number;
  colIndex: number;
  rowCriteria: GridCriteria;
  colCriteria: GridCriteria;
  puzzleId: string;
  onClose: () => void;
  onResult: (row: number, col: number, result: AnswerResponse, playerName: string) => void;
}

function CellDialog({
  rowIndex,
  colIndex,
  rowCriteria,
  colCriteria,
  puzzleId,
  onClose,
  onResult,
}: CellDialogProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PlayerSuggestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { suggestions } = usePlayerSearch(query, selected === null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelect = useCallback((suggestion: PlayerSuggestion): void => {
    setSelected(suggestion);
    setQuery(suggestion.label);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (selected === null) {
      setError('Please select a player from the suggestions.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/grid/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId,
          rowIndex,
          colIndex,
          brefId: selected.id,
        }),
      });
      if (!res.ok) {
        setError('Failed to validate answer. Please try again.');
        return;
      }
      const data = (await res.json()) as AnswerResponse;
      onResult(rowIndex, colIndex, data, selected.label);
      onClose();
    } catch {
      setError('Failed to validate answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selected, puzzleId, rowIndex, colIndex, onResult, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        void handleSubmit();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleSubmit, onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dc-primary)]/40 p-4 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Enter player for ${rowCriteria.label} × ${colCriteria.label}`}
    >
      <div className="w-full max-w-sm panel-paper p-5">
        <h2 className="mb-1 inscription-title text-lg">Enter a Player</h2>
        <p className="mb-4 text-xs text-muted">
          Must satisfy: <strong className="text-ink">{rowCriteria.label}</strong> &amp;{' '}
          <strong className="text-ink">{colCriteria.label}</strong>
        </p>

        <div className="mb-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a player name…"
            className="w-full rounded-md bg-paper-soft/95 px-3 py-2 text-sm text-ink shadow-input outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_16%,transparent)] focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-none"
            autoComplete="off"
          />
        </div>

        {suggestions.length > 0 && selected === null && (
          <ul className="mb-3 max-h-48 overflow-y-auto surface-inset rounded-md">
            {suggestions.map(s => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    handleSelect(s);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-[var(--row-hover)]"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error !== null && <p className="mb-3 text-xs text-[var(--danger)]">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={submitting || selected === null}
            className="flex-1 rounded-md bg-[var(--dc-primary)] px-4 py-2 text-sm font-semibold text-[var(--dc-on-primary)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Checking…' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[var(--button-bg)] px-4 py-2 text-sm text-ink transition-colors hover:bg-[var(--button-hover)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share overlay
// ---------------------------------------------------------------------------

interface ShareOverlayProps {
  shareText: string;
  onClose: () => void;
}

function ShareOverlay({ shareText, onClose }: ShareOverlayProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // clipboard API unavailable
    }
  }, [shareText]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dc-primary)]/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Share your result"
    >
      <div className="w-full max-w-sm panel-paper p-5">
        <h2 className="mb-1 inscription-title text-lg">🏆 You Completed the Grid!</h2>
        <p className="mb-4 text-sm text-muted">Share your result with others.</p>
        <textarea
          readOnly
          value={shareText}
          rows={7}
          className="mb-3 w-full resize-none rounded-md bg-paper-soft/95 px-3 py-2 font-mono text-xs text-ink"
          aria-label="Shareable result text"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void handleCopy();
            }}
            className="flex-1 rounded-md bg-[var(--dc-tertiary)] px-4 py-2 text-sm font-semibold text-[var(--dc-on-tertiary-fixed)] transition-opacity hover:opacity-90"
          >
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[var(--button-bg)] px-4 py-2 text-sm text-ink transition-colors hover:bg-[var(--button-hover)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
        {cols.map((col, ci) => (
          <div
            key={ci}
            className="fresco-hero min-h-[2.5rem] rounded p-1 text-center text-xs leading-tight font-semibold text-[var(--dc-on-primary)] sm:text-sm"
          >
            <CriteriaLabel criteria={col} />
          </div>
        ))}

        {/* Rows */}
        {rows.map((row, ri) => (
          <>
            {/* Row header */}
            <div
              key={`row-${ri}`}
              className="fresco-hero flex min-h-[4.5rem] items-center justify-center rounded p-1 sm:min-h-[5.5rem]"
            >
              <CriteriaLabel criteria={row} />
            </div>

            {/* Cells */}
            {cols.map((_col, ci) => (
              <GridCell
                key={`${ri}-${ci}`}
                rowIndex={ri}
                colIndex={ci}
                state={gameState.cells[`${ri}-${ci}`]}
                onClick={handleCellClick}
              />
            ))}
          </>
        ))}
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
