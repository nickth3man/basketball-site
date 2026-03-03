/**
 * @fileoverview Client-side search component with debouncing.
 * 
 * Provides a real-time search input that queries the API for players
 * and teams. Uses debouncing to reduce API calls and AbortController
 * to cancel in-flight requests when the query changes.
 * 
 * @module @/components/search-box
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Represents a single search result item.
 */
type SearchResult = {
  /** Entity type: "player" or "team" */
  type: "player" | "team";
  /** Entity ID (player bref_id or team abbreviation) */
  id: string;
  /** Display name for the result */
  label: string;
};

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
 * - `q`: Current input value
 * - `results`: Fetched search results
 * - `showResults`: Whether to display dropdown (true when q >= 2 chars and results exist)
 * 
 * @returns React component for the search box
 * @example
 * ```tsx
 * <SearchBox />
 * ```
 */
export function SearchBox() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const showResults = q.trim().length >= 2 && results.length > 0;

  useEffect(() => {
    // Don't search for very short queries
    if (q.trim().length < 2) {
      return;
    }

    // AbortController allows canceling in-flight requests
    const controller = new AbortController();
    
    // Debounce: wait 200ms after user stops typing
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (!res.ok) return;
      const data = (await res.json()) as { results: SearchResult[] };
      setResults(data.results ?? []);
    }, 200);

    // Cleanup: cancel timer and abort fetch on unmount or query change
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  return (
    <div className="relative">
      {/* Search input with focus states */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search players or teams"
        className="w-full rounded border border-line bg-white px-3 py-2 text-sm text-ink shadow-input transition-all duration-200 placeholder:text-placeholder focus:border-focus-border focus:outline-none focus:ring-2 focus:ring-focus-ring"
      />
      
      {/* Results dropdown - only shown when we have results */}
      {showResults ? (
        <div className="fade-slide-in absolute z-20 mt-1 w-full overflow-hidden rounded border border-line bg-white shadow-popover">
          {results.map((r) => (
            <Link
              key={`${r.type}-${r.id}`}
              href={r.type === "player" ? `/players/${r.id}` : `/teams/${r.id}`}
              className="block border-b border-dropdown-line px-3 py-2 text-sm transition-colors duration-150 last:border-b-0 hover:bg-paper-soft"
            >
              {/* Type badge (player/team) */}
              <span className="mr-2 text-xs uppercase text-label">
                {r.type}
              </span>
              {r.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
