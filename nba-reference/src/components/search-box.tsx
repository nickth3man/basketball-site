/**
 * @fileoverview Client-side search component with debouncing and result navigation.
 *
 * Provides a real-time search input that queries the API for cross-site
 * discovery results. Uses debouncing to reduce API calls, exposes keyboard
 * navigation, and links to the dedicated search results page.
 *
 * @module @/components/search-box
 */

'use client';

import type { JSX, SyntheticEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { routes } from '@/lib/routes';
import type { SearchEntityResult } from '@/lib/query';

const SEARCH_LABELS: Record<SearchEntityResult['type'], string> = {
  player: 'Player',
  team: 'Team',
  season: 'Season',
  game: 'Game',
  award: 'Award',
  page: 'Page',
};

/**
 * Search input component that queries entities and displays a debounced, cancellable results dropdown.
 *
 * Displays a dropdown of matching entities when the trimmed query has at least 2 characters. Requests are debounced (200ms) and in-flight fetches are cancelled via AbortController when the query changes or the component unmounts.
 *
 * @returns A JSX element rendering the search box and a results dropdown linking to matching site pages
 */
interface SearchBoxProps {
  initialQuery?: string;
}

export function SearchBox({ initialQuery = '' }: SearchBoxProps): JSX.Element {
  const router = useRouter();
  const searchId = useId();
  const listboxId = `${searchId}-results`;
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchEntityResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const trimmedQuery = query.trim();
  const showDropdown = trimmedQuery.length >= 2 && (isLoading || hasSearched);
  const activeResult = activeIndex >= 0 ? results[activeIndex] : undefined;
  const activeDescendant = activeResult ? `${listboxId}-${activeIndex}` : undefined;
  const viewAllHref = useMemo(() => routes.search(trimmedQuery), [trimmedQuery]);

  // Debounced search function
  const debouncedSearch = useCallback(async (searchQuery: string, signal: AbortSignal) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        signal,
      });
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
    // Don't search for very short queries
    if (trimmedQuery.length < 2) {
      setResults([]);
      setActiveIndex(-1);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    // AbortController allows canceling in-flight requests
    const controller = new AbortController();

    // Debounce: wait 200ms after user stops typing
    const timer = setTimeout(() => {
      void debouncedSearch(trimmedQuery, controller.signal);
    }, 200);

    // Cleanup: cancel timer and abort fetch on unmount or query change
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery, debouncedSearch]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results, trimmedQuery]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = useCallback(
    (event?: SyntheticEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (trimmedQuery.length < 2) {
        return;
      }

      router.push(viewAllHref);
      setHasSearched(false);
    },
    [router, trimmedQuery, viewAllHref]
  );

  return (
    <form role="search" className="relative" onSubmit={handleSubmit} aria-busy={isLoading}>
      <label htmlFor={searchId} className="sr-only">
        Search players, teams, seasons, games, awards, and site pages
      </label>
      <Input
        id={searchId}
        value={query}
        onChange={event => {
          setQuery(event.target.value);
        }}
        onKeyDown={event => {
          if (!showDropdown || results.length === 0) {
            if (event.key === 'Enter' && !event.defaultPrevented) {
              event.preventDefault();
              handleSubmit();
            }
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
            setHasSearched(false);
            setActiveIndex(-1);
            return;
          }

          if (event.key === 'Enter' && activeResult != null) {
            event.preventDefault();
            router.push(activeResult.href);
            setHasSearched(false);
          }
        }}
        placeholder="Search players, teams, seasons, games, awards, pages"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={showDropdown}
        aria-activedescendant={activeDescendant}
        className="w-full"
      />

      {showDropdown ? (
        <div className="absolute z-20 mt-1 w-full fade-slide-in overflow-hidden rounded border border-line bg-white shadow-popover">
          {isLoading ? (
            <div className="border-b border-dropdown-line px-3 py-3 text-sm text-muted">
              Searching...
            </div>
          ) : null}

          {!isLoading && results.length > 0 ? (
            <div id={listboxId} role="listbox" aria-label="Search suggestions">
              {results.map((result, index) => {
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
                      setHasSearched(false);
                    }}
                    className={`block border-b border-dropdown-line px-3 py-2 text-sm transition-colors duration-150 last:border-b-0 ${
                      isActive ? 'bg-paper-soft' : 'hover:bg-paper-soft'
                    }`}
                  >
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-xs text-label uppercase">
                        {SEARCH_LABELS[result.type]}
                      </span>
                      <span className="font-medium text-ink">{result.label}</span>
                    </div>
                    {result.description != null && result.description.length > 0 ? (
                      <div className="text-xs text-muted">{result.description}</div>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ) : null}

          {!isLoading && hasSearched && results.length === 0 ? (
            <div className="border-b border-dropdown-line px-3 py-3 text-sm text-muted">
              No results found.
            </div>
          ) : null}

          {trimmedQuery.length >= 2 ? (
            <Link
              href={viewAllHref}
              className="block bg-paper-soft px-3 py-2 text-sm font-medium text-link hover:underline"
            >
              View all results for &quot;{trimmedQuery}&quot;
            </Link>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
