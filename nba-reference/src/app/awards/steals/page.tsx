import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getStealsLeaders } from '@/lib/queries/awards/stat-leaders';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function StealsLeadersPage(): React.JSX.Element {
  const leaders = getStealsLeaders();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href={'/awards' as Route} className="mb-2 inline-block text-link hover:underline">
          ← All Awards
        </Link>
        <h1 className="text-3xl font-bold text-heading">Steals Leaders</h1>
        <p className="mt-1 text-muted">
          Player with the highest steals per game each NBA season (min. 25 games).
        </p>
      </div>

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">Steals Leaders by Season</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Season</th>
                <th className={tableHeaderCellClass('left')}>Player</th>
                <th className={tableHeaderCellClass('left')}>Team</th>
                <th className={tableHeaderCellClass('right')}>G</th>
                <th className={tableHeaderCellClass('right')}>SPG</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((row, index) => (
                <tr
                  key={row.season_id}
                  className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>
                    {row.start_year}-{row.end_year}
                  </td>
                  <td className={tableCellClass('left')}>
                    <Link
                      href={
                        `/players/${row.bref_id.slice(0, 1).toLowerCase()}/${row.bref_id}` as Route
                      }
                      className={tableLinkClass}
                    >
                      {row.full_name}
                    </Link>
                  </td>
                  <td className={tableCellClass('left')}>
                    {row.team_abbrev == null ? (
                      '-'
                    ) : (
                      <Link href={`/teams/${row.team_abbrev}` as Route} className={tableLinkClass}>
                        {row.team_abbrev}
                      </Link>
                    )}
                  </td>
                  <td className={tableCellClass('right')}>{row.games}</td>
                  <td className={tableCellClass('right')}>
                    <span className="font-semibold text-[var(--dc-tertiary)]">
                      {row.stat_value}
                    </span>
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
