import type React from 'react';
import Link from 'next/link';
import { PaginationNav } from '@/components/pagination-nav';
import { SavedViewsWidget, SaveViewButton } from '@/components/saved-views';
import { SearchBox } from '@/components/search-box';
import { getSearchTypeLabel, SEARCH_RESULT_TYPES, searchEntities } from '@/lib/query';
import type { SearchEntityResult, SearchResultType } from '@/lib/query';
import { coercePageNumber, paginateItems } from '@/lib/pagination';
import { routes } from '@/lib/routes';

type SearchFilter = SearchResultType | 'all';
const SEARCH_PAGE_SIZE = 12;
const SEARCH_RESULTS_FETCH_LIMIT = 180;

/** Popular suggestions shown in the empty-query state. */
const POPULAR_SUGGESTIONS = [
  'LeBron James',
  'Los Angeles Lakers',
  'NBA MVP',
  'Michael Jordan',
  'Golden State Warriors',
  '2023-24',
] as const;

interface SearchPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    type?: string;
  }>;
}

function normalizeFilter(value: string | undefined): SearchFilter {
  if (value == null || value === 'all') {
    return 'all';
  }

  return SEARCH_RESULT_TYPES.find(type => type === value) ?? 'all';
}

function groupResults(
  results: SearchEntityResult[]
): Record<SearchResultType, SearchEntityResult[]> {
  return results.reduce<Record<SearchResultType, SearchEntityResult[]>>(
    (grouped, result) => {
      grouped[result.type].push(result);
      return grouped;
    },
    {
      page: [],
      player: [],
      team: [],
      season: [],
      game: [],
      award: [],
    }
  );
}

function getSearchTypeChipLabel(type: SearchResultType): string {
  const label = getSearchTypeLabel(type);
  return label.endsWith('s') ? label.slice(0, -1) : label;
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps): Promise<React.JSX.Element> {
  const { page, q, type } = await searchParams;
  const query = q?.trim() ?? '';
  const activeFilter = normalizeFilter(type);
  const requestedPage = coercePageNumber(page);

  // Always fetch all entity types so we can show per-type counts in the sidebar.
  const allResults =
    query.length >= 2 ? searchEntities(query, { limit: SEARCH_RESULTS_FETCH_LIMIT }) : [];

  // Per-type counts derived from the full unfiltered result set.
  const allGrouped = groupResults(allResults);
  const typeCounts = Object.fromEntries(
    SEARCH_RESULT_TYPES.map(t => [t, allGrouped[t].length])
  ) as Record<SearchResultType, number>;

  // Filter for actual display
  const displayResults =
    activeFilter === 'all' ? allResults : allResults.filter(r => r.type === activeFilter);

  const paginatedResults = paginateItems(displayResults, requestedPage, SEARCH_PAGE_SIZE);
  const groupedResults = groupResults(paginatedResults.items);
  const isResultSetCapped = allResults.length === SEARCH_RESULTS_FETCH_LIMIT;
  const summary =
    query.length < 2
      ? undefined
      : paginatedResults.totalItems === 0
        ? 'No matching results.'
        : `Showing ${paginatedResults.startItem}–${paginatedResults.endItem} of ${paginatedResults.totalItems} matches.`;

  // Sidebar / top-row filter classes
  const filterBaseClass = 'flex items-center justify-between rounded-md px-3 py-2 transition-colors text-sm';
  const filterActiveClass = `${filterBaseClass} bg-[color-mix(in_srgb,var(--dc-tertiary-container)_20%,var(--dc-surface-container-highest))] text-heading shadow-input`;
  const filterIdleClass = `${filterBaseClass} bg-[var(--dc-surface-container-highest)] text-muted-strong hover:bg-button-hover`;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 inscription-title text-3xl">Search</h1>
      <p className="mb-5 text-sm text-muted">
        Find players, teams, seasons, games, award history, and key site sections from one place.
      </p>

      {/* Search input */}
      <section className="mb-6 panel-paper p-4">
        <SearchBox initialQuery={query} />

        {/* Mobile filter chips (visible below md) */}
        <div className="mt-4 flex flex-wrap gap-2 text-sm md:hidden">
          <Link
            href={routes.search(query)}
            className={activeFilter === 'all' ? filterActiveClass : filterIdleClass}
          >
            <span>All Results</span>
            <span className="ml-2 text-xs text-muted">{allResults.length}</span>
          </Link>
          {SEARCH_RESULT_TYPES.map(searchType => (
            <Link
              key={searchType}
              href={routes.search(query, searchType)}
              className={activeFilter === searchType ? filterActiveClass : filterIdleClass}
            >
              <span>{getSearchTypeLabel(searchType)}</span>
              {typeCounts[searchType] > 0 ? (
                <span className="ml-2 text-xs text-muted">{typeCounts[searchType]}</span>
              ) : null}
            </Link>
          ))}
          {query.length >= 2 ? (
            <SaveViewButton
              currentUrl={`/search?q=${encodeURIComponent(query)}${activeFilter !== 'all' ? `&type=${activeFilter}` : ''}`}
              type="search"
            />
          ) : null}
        </div>
      </section>

      <SavedViewsWidget type="search" />

      {/* Empty state — no query entered yet */}
      {query.length < 2 ? (
        <section className="panel-paper p-6">
          <p className="mb-4 text-sm text-muted-strong">
            Enter at least 2 characters to search. Try a player last name, team abbreviation,
            season year, game date, award name, or page like playoffs, draft, or birthdays.
          </p>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SUGGESTIONS.map(suggestion => (
                <Link
                  key={suggestion}
                  href={routes.search(suggestion)}
                  className="rounded-full bg-paper-soft px-3 py-1 text-sm text-muted-strong transition-colors hover:bg-button-hover"
                >
                  {suggestion}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* No results state */}
      {query.length >= 2 && paginatedResults.totalItems === 0 ? (
        <section className="panel-paper p-6">
          <p className="mb-2 text-sm text-muted-strong">
            No results found for <span className="font-semibold text-heading">{query}</span>.
          </p>
          <p className="mb-4 text-xs text-muted">
            Try a shorter query, check your spelling, or browse by category.
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SUGGESTIONS.map(suggestion => (
              <Link
                key={suggestion}
                href={routes.search(suggestion)}
                className="rounded-full bg-paper-soft px-3 py-1 text-sm text-muted-strong transition-colors hover:bg-button-hover"
              >
                {suggestion}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Results + sidebar layout */}
      {query.length >= 2 && paginatedResults.totalItems > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
          {/* Faceted filter sidebar — hidden on mobile (chips used instead) */}
          <aside className="hidden md:block">
            <div className="sticky top-20 panel-paper p-3">
              <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
                Filter by type
              </p>
              <nav aria-label="Search type filters" className="flex flex-col gap-1">
                <Link
                  href={routes.search(query)}
                  className={activeFilter === 'all' ? filterActiveClass : filterIdleClass}
                >
                  <span>All Results</span>
                  <span className="text-xs text-muted">{allResults.length}</span>
                </Link>
                {SEARCH_RESULT_TYPES.map(searchType => (
                  <Link
                    key={searchType}
                    href={routes.search(query, searchType)}
                    className={activeFilter === searchType ? filterActiveClass : filterIdleClass}
                  >
                    <span>{getSearchTypeLabel(searchType)}</span>
                    <span className="text-xs text-muted">{typeCounts[searchType]}</span>
                  </Link>
                ))}
              </nav>

              {query.length >= 2 ? (
                <div className="mt-3 border-t border-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] pt-3">
                  <SaveViewButton
                    currentUrl={`/search?q=${encodeURIComponent(query)}${activeFilter !== 'all' ? `&type=${activeFilter}` : ''}`}
                    type="search"
                  />
                </div>
              ) : null}
            </div>
          </aside>

          {/* Main results area */}
          <div className="space-y-6 min-w-0">
            {/* Summary bar */}
            <section className="panel-paper p-4 text-sm text-muted-strong">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{summary}</span>
                {isResultSetCapped ? (
                  <span className="text-xs text-muted">
                    Narrow your query to move beyond the first {SEARCH_RESULTS_FETCH_LIMIT}{' '}
                    matches.
                  </span>
                ) : null}
              </div>
            </section>

            {SEARCH_RESULT_TYPES.map(searchType => {
              const sectionResults =
                activeFilter === 'all'
                  ? groupedResults[searchType]
                  : searchType === activeFilter
                    ? paginatedResults.items
                    : [];

              if (sectionResults.length === 0) {
                return null;
              }

              return (
                <section key={searchType} className="panel-paper p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-heading">
                      {getSearchTypeLabel(searchType)}
                    </h2>
                    <span className="text-xs tracking-wide text-crumb uppercase">
                      {sectionResults.length} result{sectionResults.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {sectionResults.map(result => (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={result.href}
                        className="block surface-inset px-4 py-3 transition-colors hover:bg-paper-soft"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs tracking-wide text-label uppercase">
                            {getSearchTypeChipLabel(result.type)}
                          </span>
                          <span className="font-semibold text-heading">{result.label}</span>
                        </div>
                        {result.description != null && result.description.length > 0 ? (
                          <div className="text-sm text-muted-strong">{result.description}</div>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}

            <PaginationNav
              currentPage={paginatedResults.currentPage}
              pathname="/search"
              query={{
                q: query,
                type: activeFilter === 'all' ? undefined : activeFilter,
              }}
              summary={summary}
              totalPages={paginatedResults.totalPages}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
