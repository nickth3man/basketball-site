import type { JSX, KeyboardEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnswerResponse, GridCriteria } from '@/lib/puzzles/types';

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
          const players = data.results.filter(
            (result: PlayerSearchResult) => result.type === 'player'
          );
          setSuggestions(players.map(result => ({ id: result.id, label: result.label })));
        })
        .catch(() => {
          setSuggestions([]);
        });
    }, 250);

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [query, enabled]);

  const displayedSuggestions = enabled && query.trim().length >= 2 ? suggestions : [];
  return { suggestions: displayedSuggestions };
}

export interface CellDialogProps {
  rowIndex: number;
  colIndex: number;
  rowCriteria: GridCriteria;
  colCriteria: GridCriteria;
  puzzleId: string;
  onClose: () => void;
  onResult: (row: number, col: number, result: AnswerResponse, playerName: string) => void;
}

export function CellDialog({
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
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        void handleSubmit();
      } else if (event.key === 'Escape') {
        onClose();
      }
    },
    [handleSubmit, onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dc-primary)]/40 p-4 backdrop-blur-sm"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Enter player for ${rowCriteria.label} × ${colCriteria.label}`}
      tabIndex={-1}
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
            onChange={event => {
              setQuery(event.target.value);
              setSelected(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a player name..."
            className="w-full rounded-md bg-paper-soft/95 px-3 py-2 text-sm text-ink shadow-input outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_16%,transparent)] focus:ring-2 focus:ring-[var(--focus-ring)] focus:outline-none"
            autoComplete="off"
          />
        </div>

        {suggestions.length > 0 && selected === null ? (
          <ul className="mb-3 max-h-48 overflow-y-auto surface-inset rounded-md">
            {suggestions.map(suggestion => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  onClick={() => {
                    handleSelect(suggestion);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-[var(--row-hover)]"
                >
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {error !== null ? <p className="mb-3 text-xs text-[var(--danger)]">{error}</p> : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={submitting || selected === null}
            className="flex-1 rounded-md bg-[var(--dc-primary)] px-4 py-2 text-sm font-semibold text-[var(--dc-on-primary)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Checking...' : 'Submit'}
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

export function ShareOverlay({
  onClose,
  shareText,
}: {
  shareText: string;
  onClose: () => void;
}): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      return;
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
