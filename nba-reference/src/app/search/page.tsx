import type React from 'react';
import Link from 'next/link';
import { SearchBox } from '@/components/search-box';
import { getSearchTypeLabel, SEARCH_RESULT_TYPES, searchEntities } from '@/lib/query';
import type { SearchEntityResult, SearchResultType } from '@/lib/query';
import { routes } from '@/lib/routes';

type SearchFilter = SearchResultType | 'all';

interface SearchPageProps {
  searchParams: Promise<{
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
  const { q, type } = await searchParams;
  const query = q?.trim() ?? '';
  const activeFilter = normalizeFilter(type);
  const results =
    query.length >= 2
      ? searchEntities(
          query,
          activeFilter === 'all' ? { limit: 30 } : { limit: 30, types: [activeFilter] }
        )
      : [];
  const groupedResults = groupResults(results);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">Search</h1>
      <p className="mb-5 text-sm text-muted">
        Find players, teams, seasons, games, and award history from one place.
      </p>

      <section className="mb-6 panel-paper p-4">
        <SearchBox initialQuery={query} />
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link
            href={routes.search(query)}
            className={`rounded border px-3 py-2 transition-colors ${
              activeFilter === 'all'
                ? 'border-line bg-paper-soft text-heading'
                : 'border-line bg-button-bg text-muted-strong hover:bg-button-hover'
            }`}
          >
            All Results
          </Link>
          {SEARCH_RESULT_TYPES.map(searchType => (
            <Link
              key={searchType}
              href={routes.search(query, searchType)}
              className={`rounded border px-3 py-2 transition-colors ${
                activeFilter === searchType
                  ? 'border-line bg-paper-soft text-heading'
                  : 'border-line bg-button-bg text-muted-strong hover:bg-button-hover'
              }`}
            >
              {getSearchTypeLabel(searchType)}
            </Link>
          ))}
        </div>
      </section>

      {query.length < 2 ? (
        <section className="panel-paper p-4 text-sm text-muted-strong">
          Enter at least 2 characters to search. Try a player last name, team abbreviation, season
          year, game date, or award name.
        </section>
      ) : null}

      {query.length >= 2 && results.length === 0 ? (
        <section className="panel-paper p-4 text-sm text-muted-strong">
          No results found for <span className="font-semibold text-heading">{query}</span>.
        </section>
      ) : null}

      {query.length >= 2 && results.length > 0 ? (
        <div className="space-y-6">
          {SEARCH_RESULT_TYPES.map(searchType => {
            const sectionResults =
              activeFilter === 'all'
                ? groupedResults[searchType]
                : searchType === activeFilter
                  ? results
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
                      className="block rounded border border-line-soft bg-white px-4 py-3 transition-colors hover:bg-paper-soft"
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
        </div>
      ) : null}
    </main>
  );
}
