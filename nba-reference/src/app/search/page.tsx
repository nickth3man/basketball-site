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
  const results =
    query.length >= 2
      ? searchEntities(
          query,
          activeFilter === 'all'
            ? { limit: SEARCH_RESULTS_FETCH_LIMIT }
            : { limit: SEARCH_RESULTS_FETCH_LIMIT, types: [activeFilter] }
        )
      : [];
  const paginatedResults = paginateItems(results, requestedPage, SEARCH_PAGE_SIZE);
  const groupedResults = groupResults(paginatedResults.items);
  const isResultSetCapped = results.length === SEARCH_RESULTS_FETCH_LIMIT;
  const summary =
    query.length < 2
      ? undefined
      : paginatedResults.totalItems === 0
        ? 'No matching results.'
        : `Showing ${paginatedResults.startItem}-${paginatedResults.endItem} of ${paginatedResults.totalItems} matches.`;
  const filterBaseClass = 'rounded-md px-3 py-2 transition-colors';
  const filterActiveClass = `${filterBaseClass} bg-[color-mix(in_srgb,var(--dc-tertiary-container)_20%,var(--dc-surface-container-highest))] text-heading shadow-input`;
  const filterIdleClass = `${filterBaseClass} bg-[var(--dc-surface-container-highest)] text-muted-strong hover:bg-button-hover`;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 inscription-title text-3xl">Search</h1>
      <p className="mb-5 text-sm text-muted">
        Find players, teams, seasons, games, award history, and key site sections from one place.
      </p>

      <section className="mb-6 panel-paper p-4">
        <SearchBox initialQuery={query} />
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link
            href={routes.search(query)}
            className={activeFilter === 'all' ? filterActiveClass : filterIdleClass}
          >
            All Results
          </Link>
          {SEARCH_RESULT_TYPES.map(searchType => (
            <Link
              key={searchType}
              href={routes.search(query, searchType)}
              className={activeFilter === searchType ? filterActiveClass : filterIdleClass}
            >
              {getSearchTypeLabel(searchType)}
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

      {query.length < 2 ? (
        <section className="panel-paper p-4 text-sm text-muted-strong">
          Enter at least 2 characters to search. Try a player last name, team abbreviation, season
          year, game date, award name, or page like playoffs, draft, or birthdays.
        </section>
      ) : null}

      {query.length >= 2 && paginatedResults.totalItems === 0 ? (
        <section className="panel-paper p-4 text-sm text-muted-strong">
          No results found for <span className="font-semibold text-heading">{query}</span>.
        </section>
      ) : null}

      {query.length >= 2 && paginatedResults.totalItems > 0 ? (
        <div className="space-y-6">
          <section className="panel-paper p-4 text-sm text-muted-strong">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{summary}</span>
              {isResultSetCapped ? (
                <span className="text-xs text-muted">
                  Narrow your query to move beyond the first {SEARCH_RESULTS_FETCH_LIMIT} matches.
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
      ) : null}
    </main>
  );
}
