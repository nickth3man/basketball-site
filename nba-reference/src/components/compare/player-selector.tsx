'use client';

import type { JSX, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';

interface SearchResult {
  id: string;
  label: string;
  description: string | null;
}

interface PlayerSelectorProps {
  slot: 'p1' | 'p2';
  selectedPlayer?: { id: string; name: string } | undefined;
  otherPlayerId?: string | undefined;
}

export function PlayerSelector({
  slot,
  selectedPlayer,
  otherPlayerId,
}: PlayerSelectorProps): JSX.Element {
  const router = useRouter();
  const inputId = useId();
  const listboxId = `${inputId}-results`;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmedQuery = query.trim();
  const activeResult = activeIndex >= 0 ? results[activeIndex] : undefined;

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setResults([]);
      setShowDropdown(false);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchResults = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}&type=player`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setResults([]);
          setShowDropdown(true);
          return;
        }
        const data = (await res.json()) as {
          results: Array<{
            id: string;
            label: string;
            description: string | null;
            type: string;
          }>;
        };
        const players = data.results.filter(r => r.type === 'player').slice(0, 8);
        setResults(players);
        setShowDropdown(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setResults([]);
        setShowDropdown(true);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void fetchResults();
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  const selectPlayer = useCallback(
    (player: SearchResult) => {
      const newP1 = slot === 'p1' ? player.id : otherPlayerId;
      const newP2 = slot === 'p2' ? player.id : otherPlayerId;
      router.push(routes.compare(newP1, newP2));
      setQuery('');
      setShowDropdown(false);
      setResults([]);
    },
    [router, slot, otherPlayerId]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || results.length === 0) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex(current => (current + 1) % results.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex(current => (current <= 0 ? results.length - 1 : current - 1));
        return;
      }

      if (event.key === 'Escape') {
        setShowDropdown(false);
        setActiveIndex(-1);
        return;
      }

      if (event.key === 'Enter' && activeResult != null) {
        event.preventDefault();
        selectPlayer(activeResult);
      }
    },
    [showDropdown, results, activeResult, selectPlayer]
  );

  const handleClear = useCallback(() => {
    const newP1 = slot === 'p1' ? undefined : otherPlayerId;
    const newP2 = slot === 'p2' ? undefined : otherPlayerId;
    router.push(routes.compare(newP1, newP2));
  }, [router, slot, otherPlayerId]);

  return (
    <div className="relative">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-label">
        {slot === 'p1' ? 'Player 1' : 'Player 2'}
      </label>
      {selectedPlayer ? (
        <div className="flex items-center justify-between surface-inset px-3 py-2">
          <span className="font-medium text-heading">{selectedPlayer.name}</span>
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 text-sm text-muted hover:text-heading"
          >
            Clear
          </button>
        </div>
      ) : (
        <>
          <input
            id={inputId}
            type="text"
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (trimmedQuery.length >= 2) {
                setShowDropdown(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowDropdown(false);
              }, 150);
            }}
            placeholder="Search for a player..."
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={showDropdown}
            className="w-full rounded-md bg-paper-soft/95 px-3 py-2 text-sm text-ink shadow-input outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_16%,transparent)] backdrop-blur-sm transition-all duration-200 placeholder:text-placeholder focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-1 focus:ring-offset-[var(--paper-soft)] focus:outline-none"
          />

          {showDropdown ? (
            <div
              id={listboxId}
              role="listbox"
              className="absolute z-20 mt-2 w-full fade-slide-in overflow-hidden surface-glass shadow-popover"
            >
              {isLoading ? <div className="px-3 py-3 text-sm text-muted">Searching...</div> : null}

              {!isLoading && results.length > 0
                ? results.map((result, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <button
                        key={result.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => {
                          setActiveIndex(index);
                        }}
                        onClick={() => {
                          selectPlayer(result);
                        }}
                        className={cn(
                          'block w-full px-3 py-2 text-left text-sm transition-colors',
                          isActive
                            ? 'bg-[color-mix(in_srgb,var(--dc-tertiary-container)_14%,var(--dc-surface-container-low))]'
                            : 'hover:bg-paper-soft/80'
                        )}
                      >
                        <span className="font-medium text-ink">{result.label}</span>
                        {result.description != null && result.description.length > 0 ? (
                          <span className="ml-2 text-xs text-muted">{result.description}</span>
                        ) : null}
                      </button>
                    );
                  })
                : null}

              {!isLoading && results.length === 0 && trimmedQuery.length >= 2 ? (
                <div className="px-3 py-3 text-sm text-muted">No players found.</div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
