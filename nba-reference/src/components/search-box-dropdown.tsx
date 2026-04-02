import type { JSX, RefObject } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import {
  getSearchTypeLabel,
  SEARCH_RESULT_TYPES,
  type SearchEntityResult,
  type SearchResultType,
} from '@/lib/query/search-shared';
import { HighlightedLabel, SEARCH_LABELS } from './search-box-utils';

interface SearchDropdownProps {
  activeFilter: SearchResultType | 'all';
  activeIndex: number;
  closeDropdown: () => void;
  filteredResults: SearchEntityResult[];
  hasSearched: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  listboxId: string;
  persistSearch: (searchQuery: string) => void;
  recentSearches: string[];
  setActiveFilter: (filter: SearchResultType | 'all') => void;
  setActiveIndex: (index: number) => void;
  setQuery: (query: string) => void;
  trimmedQuery: string;
  viewAllHref: Route;
}

function RecentSearchesList({
  inputRef,
  listboxId,
  recentSearches,
  setActiveIndex,
  setQuery,
}: Pick<
  SearchDropdownProps,
  'inputRef' | 'listboxId' | 'recentSearches' | 'setActiveIndex' | 'setQuery'
>): JSX.Element {
  return (
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
            setActiveIndex(-1);
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
  );
}

function SearchFilterChips({
  activeFilter,
  inputRef,
  setActiveFilter,
  setActiveIndex,
}: Pick<
  SearchDropdownProps,
  'activeFilter' | 'inputRef' | 'setActiveFilter' | 'setActiveIndex'
>): JSX.Element {
  return (
    <div className="flex gap-1.5 overflow-x-auto px-3 pt-2.5 pb-1.5">
      <button
        type="button"
        onClick={() => {
          setActiveFilter('all');
          setActiveIndex(-1);
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
            setActiveIndex(-1);
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
  );
}

export function SearchDropdown({
  activeFilter,
  activeIndex,
  closeDropdown,
  filteredResults,
  hasSearched,
  inputRef,
  isLoading,
  listboxId,
  persistSearch,
  recentSearches,
  setActiveFilter,
  setActiveIndex,
  setQuery,
  trimmedQuery,
  viewAllHref,
}: SearchDropdownProps): JSX.Element {
  return (
    <div className="absolute z-20 mt-2 w-full fade-slide-in overflow-hidden surface-glass shadow-popover">
      {trimmedQuery.length < 2 && recentSearches.length > 0 ? (
        <RecentSearchesList
          inputRef={inputRef}
          listboxId={listboxId}
          recentSearches={recentSearches}
          setActiveIndex={setActiveIndex}
          setQuery={setQuery}
        />
      ) : null}

      {trimmedQuery.length >= 2 && hasSearched ? (
        <SearchFilterChips
          activeFilter={activeFilter}
          inputRef={inputRef}
          setActiveFilter={setActiveFilter}
          setActiveIndex={setActiveIndex}
        />
      ) : null}

      {isLoading ? <div className="px-4 py-3 text-sm text-muted">Searching...</div> : null}

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
  );
}
