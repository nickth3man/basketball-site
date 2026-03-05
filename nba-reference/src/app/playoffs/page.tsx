import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getPlayoffSeasons } from '@/lib/queries/playoffs';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function PlayoffsPage(): React.JSX.Element {
  const seasons = getPlayoffSeasons();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">NBA Playoffs</h1>
      <p className="mb-5 text-sm text-muted">
        Historical playoff results, series, and champions by season.
      </p>

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">Select Season</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Season</th>
                <th className={tableHeaderCellClass('left')}>Year Range</th>
                <th className={tableHeaderCellClass('left')}>View</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season, index) => (
                <tr
                  key={season.season_id}
                  className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>
                    <Link
                      href={`/playoffs/${season.season_id}` as Route}
                      className={tableLinkClass}
                    >
                      {season.season_id} Playoffs
                    </Link>
                  </td>
                  <td className={tableCellClass('left')}>
                    {season.start_year}-{season.end_year}
                  </td>
                  <td className={tableCellClass('left')}>
                    <Link
                      href={`/playoffs/${season.season_id}` as Route}
                      className="text-link hover:underline"
                    >
                      View Bracket →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
