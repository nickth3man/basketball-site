/**
 * @fileoverview Client-side search component with debouncing, autocomplete, and advanced UX.
 *
 * Provides a real-time search input with:
 * - Debounced API queries (200 ms)
 * - Type-ahead match highlighting (gold)
 * - Result-type filter chips for instant client-side narrowing
 * - Recent searches stored in localStorage (shown on focus)
 * - Global keyboard shortcut (`/` or Cmd+K) to focus from any page
 * - Keyboard shortcut hint in the input wrapper
 * - Proper focus/blur handling so the dropdown persists on chip/result clicks
 *
 * @module @/components/search-box
 */

'use client';

import type { JSX, SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { getSearchTypeLabel, SEARCH_RESULT_TYPES } from '@/lib/query';
import { routes } from '@/lib/routes';
import type { SearchEntityResult, SearchResultType } from '@/lib/query';

const SEARCH_LABELS: Record<SearchEntityResult['type'], string> = {
  player: 'Player',
  team: 'Team',
  season: 'Season',
  game: 'Game',
  award: 'Award',
  page: 'Page',
};

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored === null || stored.length === 0) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter((item): item is string => typeof item === 'string')
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): void {
  try {
    const current = getRecentSearches();
    const updated = [query, ...current.filter(s => s !== query)].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors (e.g., private browsing with full quota)
  }
}

/** Wraps the matching substring with a gold <mark> for type-ahead highlighting. */
function HighlightedLabel({ label, query }: { label: string; query: string }): JSX.Element {
  if (query.length < 2) return <>{label}</>;

  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerLabel.indexOf(lowerQuery);
  if (idx === -1) return <>{label}</>;

  return (
    <>
      {label.slice(0, idx)}
      <mark className="bg-transparent font-bold text-[var(--dc-tertiary)]">
        {label.slice(idx, idx + query.length)}
      </mark>
      {label.slice(idx + query.length)}
    </>
  );
}

interface SearchBoxProps {
  initialQuery?: string;
  /** When true, attaches the global `/` and Cmd+K keyboard shortcut to focus this input. */
  enableGlobalShortcut?: boolean;
}

/**
 * Search input component with autocomplete dropdown, type-ahead highlighting,
 * filter chips, recent searches, and optional global keyboard shortcut.
 */
export function SearchBox({
  initialQuery = '',
  enableGlobalShortcut = false,
}: SearchBoxProps): JSX.Element {
  const router = useRouter();
  const searchId = useId();
  const listboxId = `${searchId}-results`;
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchEntityResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<SearchResultType | 'all'>('all');

  const trimmedQuery = query.trim();

  /** Filter results client-side without re-fetching */
  const filteredResults = useMemo(
    () => (activeFilter === 'all' ? results : results.filter(r => r.type === activeFilter)),
    [results, activeFilter]
  );

  const showDropdown =
    isFocused && (trimmedQuery.length >= 2 ? isLoading || hasSearched : recentSearches.length > 0);

  const activeResult = activeIndex >= 0 ? filteredResults[activeIndex] : undefined;
  const activeDescendant = activeResult ? `${listboxId}-${activeIndex}` : undefined;
  const viewAllHref = useMemo(() => routes.search(trimmedQuery), [trimmedQuery]);

  // Load recent searches once on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Global keyboard shortcut: `/` or Cmd+K → focus this search input
  useEffect(() => {
    if (!enableGlobalShortcut) return;

    function handleGlobalKeyDown(event: KeyboardEvent): void {
      // Cmd+K / Ctrl+K (case-insensitive to handle Shift held down)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      // `/` when focus is NOT already inside an editable element
      if (event.key === '/') {
        const target = event.target as Element;
        const isEditable =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          (target instanceof HTMLElement && target.isContentEditable);

        if (!isEditable) {
          event.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [enableGlobalShortcut]);

  // Debounced search – always fetches all types; filtering is done client-side
  const debouncedSearch = useCallback(async (searchQuery: string, signal: AbortSignal) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, { signal });
      if (!res.ok) {
        setResults([]);
        setHasSearched(true);
        return;
      }
      const data = (await res.json()) as { results: SearchEntityResult[] | undefined };
      setResults(data.results ?? []);
      setHasSearched(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setResults([]);
      setActiveIndex(-1);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void debouncedSearch(trimmedQuery, controller.signal);
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery, debouncedSearch]);

  // Reset active index when visible results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [filteredResults, trimmedQuery]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const persistSearch = useCallback((searchQuery: string) => {
    if (searchQuery.length >= 2) {
      saveRecentSearch(searchQuery);
      setRecentSearches(getRecentSearches());
    }
  }, []);

  const closeDropdown = useCallback(() => {
    setHasSearched(false);
    setIsFocused(false);
  }, []);

  const handleSubmit = useCallback(
    (event?: SyntheticEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (trimmedQuery.length < 2) return;
      persistSearch(trimmedQuery);
      router.push(viewAllHref);
      closeDropdown();
    },
    [router, trimmedQuery, viewAllHref, persistSearch, closeDropdown]
  );

  return (
    <form
      ref={formRef}
      role="search"
      className="relative"
      onSubmit={handleSubmit}
      aria-busy={isLoading}
    >
      <label htmlFor={searchId} className="sr-only">
        Search players, teams, seasons, games, awards, and site pages
      </label>

      {/* Input wrapper — positions the keyboard-shortcut hint */}
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          id={searchId}
          value={query}
          onChange={event => {
            setQuery(event.target.value);
          }}
          onFocus={() => {
            setIsFocused(true);
            setRecentSearches(getRecentSearches());
          }}
          onBlur={event => {
            // Keep dropdown open when focus moves to something inside the form
            // (e.g., a filter chip button or a result link).
            const relatedTarget = event.relatedTarget as Node | null;
            if (formRef.current?.contains(relatedTarget) === true) return;
            setIsFocused(false);
          }}
          onKeyDown={event => {
            if (!showDropdown) {
              if (event.key === 'Enter' && !event.defaultPrevented) {
                event.preventDefault();
                handleSubmit();
              }
              return;
            }

            const items = trimmedQuery.length >= 2 ? filteredResults : [];

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex(current => (items.length > 0 ? (current + 1) % items.length : -1));
              return;
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex(current =>
                items.length > 0 ? (current <= 0 ? items.length - 1 : current - 1) : -1
              );
              return;
            }

            if (event.key === 'Escape') {
              closeDropdown();
              setActiveIndex(-1);
              inputRef.current?.blur();
              return;
            }

            if (event.key === 'Enter') {
              event.preventDefault();
              if (activeResult != null) {
                persistSearch(trimmedQuery);
                router.push(activeResult.href);
                closeDropdown();
              } else {
                handleSubmit();
              }
            }
          }}
          placeholder="Search players, teams, seasons, games, awards, pages"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showDropdown}
          aria-activedescendant={activeDescendant}
          className="w-full pr-8"
        />

        {/* `/` keyboard-shortcut hint — desktop only, hidden when focused */}
        {!isFocused ? (
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 hidden rounded border border-[color-mix(in_srgb,var(--dc-outline-variant)_30%,transparent)] px-1.5 py-0.5 text-xs font-medium text-muted select-none sm:inline-block"
          >
            /
          </kbd>
        ) : null}
      </div>

      {/* Dropdown */}
      {showDropdown ? (
        <div
          className="absolute z-20 mt-2 w-full fade-slide-in overflow-hidden surface-glass shadow-popover"
          onMouseDown={event => {
            // Prevent the input from blurring when the user clicks inside the dropdown
            // (filter chips, result links, recent-search buttons).
            event.preventDefault();
          }}
        >
          {/* Recent searches — shown when query is too short */}
          {trimmedQuery.length < 2 && recentSearches.length > 0 ? (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-medium tracking-wide text-muted uppercase">
                Recent Searches
              </p>
              {recentSearches.map((search, index) => (
                <button
                  key={search}
                  id={`${listboxId}-recent-${index}`}
                  type="button"
                  onClick={() => {
                    setQuery(search);
                    inputRef.current?.focus();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-paper-soft/80"
                >
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-muted-strong">{search}</span>
                </button>
              ))}
            </div>
          ) : null}

          {/* Filter chips — shown while results are loaded */}
          {trimmedQuery.length >= 2 && hasSearched ? (
            <div className="flex gap-1.5 overflow-x-auto px-3 pt-2.5 pb-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  inputRef.current?.focus();
                }}
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-[var(--dc-tertiary-container)] text-[var(--dc-on-tertiary-fixed)]'
                    : 'bg-paper-soft text-muted-strong hover:bg-button-hover'
                }`}
              >
                All
              </button>
              {SEARCH_RESULT_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setActiveFilter(type);
                    inputRef.current?.focus();
                  }}
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    activeFilter === type
                      ? 'bg-[var(--dc-tertiary-container)] text-[var(--dc-on-tertiary-fixed)]'
                      : 'bg-paper-soft text-muted-strong hover:bg-button-hover'
                  }`}
                >
                  {getSearchTypeLabel(type)}
                </button>
              ))}
            </div>
          ) : null}

          {isLoading ? <div className="px-4 py-3 text-sm text-muted">Searching…</div> : null}

          {/* Search results */}
          {!isLoading && trimmedQuery.length >= 2 && filteredResults.length > 0 ? (
            <div id={listboxId} role="listbox" aria-label="Search suggestions">
              {filteredResults.map((result, index) => {
                const isActive = index === activeIndex;
                return (
                  <Link
                    id={`${listboxId}-${index}`}
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => {
                      setActiveIndex(index);
                    }}
                    onClick={() => {
                      persistSearch(trimmedQuery);
                      closeDropdown();
                    }}
                    className={`block px-4 py-2.5 text-sm transition-colors duration-150 ${
                      isActive
                        ? 'bg-[color-mix(in_srgb,var(--dc-tertiary-container)_14%,var(--dc-surface-container-low))]'
                        : 'hover:bg-paper-soft/80'
                    }`}
                  >
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-xs font-medium tracking-wide text-label uppercase">
                        {SEARCH_LABELS[result.type]}
                      </span>
                      <span className="font-medium text-ink">
                        <HighlightedLabel label={result.label} query={trimmedQuery} />
                      </span>
                    </div>
                    {result.description != null && result.description.length > 0 ? (
                      <div className="text-xs text-muted">{result.description}</div>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ) : null}

          {!isLoading && hasSearched && filteredResults.length === 0 && trimmedQuery.length >= 2 ? (
            <div className="px-4 py-3 text-sm text-muted">No results found.</div>
          ) : null}

          {trimmedQuery.length >= 2 ? (
            <Link
              href={viewAllHref}
              onClick={() => {
                persistSearch(trimmedQuery);
                closeDropdown();
              }}
              className="block border-t border-[color-mix(in_srgb,var(--dc-outline-variant)_10%,transparent)] bg-[color-mix(in_srgb,var(--dc-surface-container-low)88%,var(--dc-tertiary-container)12%)] px-4 py-2.5 text-sm font-medium text-link transition-colors hover:brightness-110"
            >
              View all results for &quot;{trimmedQuery}&quot;
            </Link>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
