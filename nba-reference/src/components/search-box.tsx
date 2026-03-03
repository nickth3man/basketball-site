/**
 * @fileoverview Client-side search component with debouncing.
 *
 * Provides a real-time search input that queries the API for players
 * and teams. Uses debouncing to reduce API calls and AbortController
 * to cancel in-flight requests when the query changes.
 *
 * @module @/components/search-box
 */

'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

/**
 * Represents a single search result item.
 */
interface SearchResult {
  /** Entity type: "player" or "team" */
  type: 'player' | 'team';
  /** Entity ID (player bref_id or team abbreviation) */
  id: string;
  /** Display name for the result */
  label: string;
}

/**
 * Search box component with debounced API calls.
 *
 * Features:
 * - Debounced search (200ms delay) to reduce API calls
 * - AbortController for canceling outdated requests
 * - Minimum 2-character query threshold
 * - Dropdown results with player/team type badges
 * - Direct links to entity pages
 *
 * State Management:
 * - `query`: Current input value
 * - `results`: Fetched search results
 * - `showResults`: Whether to display dropdown (true when query >= 2 chars and results exist)
 *
 * @returns React component for the search box
 * @example
 * ```tsx
 * <SearchBox />
 * ```
 */
export function SearchBox(): JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const showResults = query.trim().length >= 2 && results.length > 0;

  // Debounced search function
  const debouncedSearch = useCallback(async (searchQuery: string, signal: AbortSignal) => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
      signal,
    });
    if (!res.ok) return;
    const data = (await res.json()) as { results: SearchResult[] };
    setResults(data.results);
  }, []);

  useEffect(() => {
    // Don't search for very short queries
    if (query.trim().length < 2) {
      return;
    }

    // AbortController allows canceling in-flight requests
    const controller = new AbortController();

    // Debounce: wait 200ms after user stops typing
    const timer = setTimeout(() => {
      void debouncedSearch(query, controller.signal);
    }, 200);

    // Cleanup: cancel timer and abort fetch on unmount or query change
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, debouncedSearch]);

  return (
    <div className="relative">
      {/* Search input with focus states */}
      <input
        value={query}
        onChange={event => {
          setQuery(event.target.value);
        }}
        placeholder="Search players or teams"
        className="w-full rounded border border-line bg-white px-3 py-2 text-sm text-ink shadow-input transition-all duration-200 placeholder:text-placeholder focus:border-focus-border focus:ring-2 focus:ring-focus-ring focus:outline-none"
      />

      {/* Results dropdown - only shown when we have results */}
      {showResults ? (
        <div className="absolute z-20 mt-1 w-full fade-slide-in overflow-hidden rounded border border-line bg-white shadow-popover">
          {results.map(result => (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.type === 'player' ? `/players/${result.id}` : `/teams/${result.id}`}
              className="block border-b border-dropdown-line px-3 py-2 text-sm transition-colors duration-150 last:border-b-0 hover:bg-paper-soft"
            >
              {/* Type badge (player/team) */}
              <span className="mr-2 text-xs text-label uppercase">{result.type}</span>
              {result.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
