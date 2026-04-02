import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getAllStarSelectionHistory } from '@/lib/queries/allstar';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function AllStarVotingPage(): React.JSX.Element {
  const selections = getAllStarSelectionHistory();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href={'/awards' as Route} className="mb-2 inline-block text-link hover:underline">
          ← All Awards
        </Link>
        <h1 className="text-3xl font-bold text-heading">NBA All-Star Selections</h1>
        <p className="mt-1 text-muted">
          All-Star game rosters by season — starters and reserves for each conference.
        </p>
      </div>

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">All-Star Selections by Season</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Season</th>
                <th className={tableHeaderCellClass('left')}>Conference</th>
                <th className={tableHeaderCellClass('left')}>Player</th>
                <th className={tableHeaderCellClass('left')}>Team</th>
                <th className={tableHeaderCellClass('left')}>Role</th>
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
                  <td className={tableCellClass('left')}>{sel.selection_team}</td>
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
                    {sel.is_replacement === 1 ? (
                      <span className="text-muted">Replacement</span>
                    ) : sel.is_starter === 1 ? (
                      <span className="font-semibold text-[var(--dc-tertiary)]">Starter</span>
                    ) : (
                      'Reserve'
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
