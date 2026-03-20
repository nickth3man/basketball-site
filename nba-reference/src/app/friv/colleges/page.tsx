import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { PaginationNav } from '@/components/pagination-nav';
import { coercePageNumber, paginateItems } from '@/lib/pagination';
import { getPlayersByCollege } from '@/lib/queries/frivolities';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default async function CollegesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}): Promise<React.JSX.Element> {
  const { page, q } = await searchParams;
  const colleges = getPlayersByCollege();
  const query = q?.trim().toLowerCase() ?? '';
  const filteredColleges =
    query.length === 0
      ? colleges
      : colleges.filter(college => college.college.toLowerCase().includes(query));
  const paginatedColleges = paginateItems(filteredColleges, coercePageNumber(page), 50);
  const startRank = paginatedColleges.startItem;
  const summary =
    paginatedColleges.totalItems === 0
      ? 'No colleges matched that filter.'
      : `Showing ${paginatedColleges.startItem}-${paginatedColleges.endItem} of ${paginatedColleges.totalItems} colleges.`;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">NBA Players by College</h1>
      <p className="mb-5 text-sm text-muted">
        Colleges that have produced NBA players, ranked by number of alumni with name filtering.
      </p>

      <section className="panel-paper p-4">
        <form method="get" className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Filter colleges"
            className="w-full rounded border border-line bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded border border-line bg-button-bg px-4 py-2 text-sm hover:bg-button-hover"
          >
            Apply
          </button>
          {query.length > 0 ? (
            <Link
              href="/friv/colleges"
              className="rounded border border-line bg-button-bg px-4 py-2 text-sm hover:bg-button-hover"
            >
              Clear
            </Link>
          ) : null}
        </form>
        <h2 className="mb-3 text-xl font-bold text-heading">
          All Colleges ({paginatedColleges.totalItems})
        </h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Rank</th>
                <th className={tableHeaderCellClass('left')}>College</th>
                <th className={tableHeaderCellClass('right')}>Players</th>
                <th className={tableHeaderCellClass('left')}>Notable Alumni</th>
              </tr>
            </thead>
            <tbody>
              {paginatedColleges.items.map((college, index) => {
                const playerIds = college.players.split(',').slice(0, 3);
                const displayRank = startRank + index;

                return (
                  <tr
                    key={college.college}
                    className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                  >
                    <td className={tableCellClass('left')}>{displayRank}</td>
                    <td className={tableCellClass('left')}>{college.college}</td>
                    <td className={tableCellClass('right')}>{college.player_count}</td>
                    <td className={tableCellClass('left')}>
                      <div className="flex flex-wrap gap-2">
                        {playerIds.map(playerId => (
                          <Link
                            key={playerId}
                            href={
                              `/players/${playerId.slice(0, 1).toLowerCase()}/${playerId}` as Route
                            }
                            className={tableLinkClass}
                          >
                            {playerId}
                          </Link>
                        ))}
                        {college.player_count > 3 && (
                          <span className="text-sm text-muted">
                            +{college.player_count - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationNav
          currentPage={paginatedColleges.currentPage}
          pathname={'/friv/colleges' as Route}
          query={{ q: query.length > 0 ? (q?.trim() ?? '') : undefined }}
          summary={summary}
          totalPages={paginatedColleges.totalPages}
        />
      </section>
    </main>
  );
}
