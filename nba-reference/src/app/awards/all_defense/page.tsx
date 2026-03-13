import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getAllDefensiveHistory } from '@/lib/queries/awards';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function AllDefensePage(): React.JSX.Element {
  const selections = getAllDefensiveHistory();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href={'/awards' as Route} className="mb-2 inline-block text-link hover:underline">
          ← All Awards
        </Link>
        <h1 className="text-3xl font-bold text-heading">All-Defensive Teams</h1>
        <p className="mt-1 text-muted">
          Historical first-team and second-team All-Defensive selections by season.
        </p>
      </div>

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">All-Defensive Selections by Season</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Season</th>
                <th className={tableHeaderCellClass('left')}>Team</th>
                <th className={tableHeaderCellClass('left')}>Position</th>
                <th className={tableHeaderCellClass('left')}>Player</th>
                <th className={tableHeaderCellClass('left')}>NBA Team</th>
              </tr>
            </thead>
            <tbody>
              {selections.map((selection, index) => (
                <tr
                  key={`${selection.season_id}-${selection.team_number}-${selection.position}-${selection.bref_id}`}
                  className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>
                    {selection.start_year}-{selection.end_year}
                  </td>
                  <td className={tableCellClass('left')}>
                    <span className="font-medium">{selection.team_name}</span>
                  </td>
                  <td className={tableCellClass('left')}>{selection.position}</td>
                  <td className={tableCellClass('left')}>
                    <Link
                      href={
                        `/players/${selection.bref_id.slice(0, 1).toLowerCase()}/${selection.bref_id}` as Route
                      }
                      className={tableLinkClass}
                    >
                      {selection.full_name}
                    </Link>
                  </td>
                  <td className={tableCellClass('left')}>
                    {selection.team_abbrev == null ? (
                      '-'
                    ) : (
                      <Link
                        href={`/teams/${selection.team_abbrev}` as Route}
                        className={tableLinkClass}
                      >
                        {selection.team_abbrev}
                      </Link>
                    )}
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
