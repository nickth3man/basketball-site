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
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { routes } from '@/lib/routes';
import type { SearchEntityResult, SearchResultType } from '@/lib/query/search-shared';
import { SearchDropdown } from './search-box-dropdown';
import { getRecentSearches, normalizeRecentSearch, saveRecentSearch } from './search-box-utils';

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

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const persistSearch = useCallback((searchQuery: string) => {
    const normalizedQuery = normalizeRecentSearch(searchQuery);
    if (normalizedQuery.length >= 2) {
      setRecentSearches(saveRecentSearch(normalizedQuery));
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
    <div className="relative" aria-busy={isLoading}>
      <form ref={formRef} onSubmit={handleSubmit}>
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
              setActiveIndex(-1);
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
            <kbd className="pointer-events-none absolute right-2.5 hidden rounded border border-[color-mix(in_srgb,var(--dc-outline-variant)_30%,transparent)] px-1.5 py-0.5 text-xs font-medium text-muted select-none sm:inline-block">
              /
            </kbd>
          ) : null}
        </div>

        {/* Dropdown */}
        {showDropdown ? (
          <SearchDropdown
            activeFilter={activeFilter}
            activeIndex={activeIndex}
            closeDropdown={closeDropdown}
            filteredResults={filteredResults}
            hasSearched={hasSearched}
            inputRef={inputRef}
            isLoading={isLoading}
            listboxId={listboxId}
            persistSearch={persistSearch}
            recentSearches={recentSearches}
            setActiveFilter={setActiveFilter}
            setActiveIndex={setActiveIndex}
            setQuery={setQuery}
            trimmedQuery={trimmedQuery}
            viewAllHref={viewAllHref}
          />
        ) : null}
      </form>
    </div>
  );
}
