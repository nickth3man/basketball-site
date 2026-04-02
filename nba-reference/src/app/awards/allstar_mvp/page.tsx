import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getAllStarMVPs } from '@/lib/queries/allstar';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function AllStarMVPPage(): React.JSX.Element {
  const mvps = getAllStarMVPs();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href={'/awards' as Route} className="mb-2 inline-block text-link hover:underline">
          ← All Awards
        </Link>
        <h1 className="text-3xl font-bold text-heading">NBA All-Star Game MVP</h1>
        <p className="mt-1 text-muted">Most Valuable Player of the NBA All-Star Game by season.</p>
      </div>

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">All-Star MVPs by Season</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Season</th>
                <th className={tableHeaderCellClass('left')}>Year</th>
                <th className={tableHeaderCellClass('left')}>Player</th>
                <th className={tableHeaderCellClass('left')}>Team</th>
              </tr>
            </thead>
            <tbody>
              {mvps.map((mvp, index) => (
                <tr
                  key={mvp.season_id}
                  className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>{mvp.season_id}</td>
                  <td className={tableCellClass('left')}>
                    {mvp.start_year}-{mvp.end_year}
                  </td>
                  <td className={tableCellClass('left')}>
                    <Link
                      href={
                        `/players/${mvp.bref_id.slice(0, 1).toLowerCase()}/${mvp.bref_id}` as Route
                      }
                      className={tableLinkClass}
                    >
                      {mvp.full_name}
                    </Link>
                  </td>
                  <td className={tableCellClass('left')}>{mvp.team_abbrev ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
