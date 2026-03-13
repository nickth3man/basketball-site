import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getAllNBAHistory } from '@/lib/queries/awards';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function AllLeaguePage(): React.JSX.Element {
  const selections = getAllNBAHistory();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href={'/awards' as Route} className="mb-2 inline-block text-link hover:underline">
          ← All Awards
        </Link>
        <h1 className="text-3xl font-bold text-heading">All-NBA Teams</h1>
        <p className="mt-1 text-muted">The best 15 players in the league by season</p>
      </div>

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">All-NBA Selections by Season</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Season</th>
                <th className={tableHeaderCellClass('left')}>Team</th>
                <th className={tableHeaderCellClass('left')}>Position</th>
                <th className={tableHeaderCellClass('left')}>Player</th>
                <th className={tableHeaderCellClass('left')}>Team</th>
                <th className={tableHeaderCellClass('left')}>Votes</th>
              </tr>
            </thead>
            <tbody>
              {selections.map((sel, index) => (
                <tr
                  key={`${sel.season_id}-${sel.bref_id}`}
                  className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>
                    {sel.start_year}-{sel.end_year}
                  </td>
                  <td className={tableCellClass('left')}>
                    <span className="font-medium">{sel.team_name}</span>
                  </td>
                  <td className={tableCellClass('left')}>{sel.position}</td>
                  <td className={tableCellClass('left')}>
                    <Link
                      href={
                        `/players/${sel.bref_id.slice(0, 1).toLowerCase()}/${sel.bref_id}` as Route
                      }
                      className={tableLinkClass}
                    >
                      {sel.full_name}
                    </Link>
                  </td>
                  <td className={tableCellClass('left')}>
                    {sel.team_abbrev == null ? (
                      '-'
                    ) : (
                      <Link href={`/teams/${sel.team_abbrev}` as Route} className={tableLinkClass}>
                        {sel.team_abbrev}
                      </Link>
                    )}
                  </td>
                  <td className={tableCellClass('left')}>
                    <Link
                      href={`/awards/all_league/${sel.season_id}/votes` as Route}
                      className={tableLinkClass}
                    >
                      View
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
