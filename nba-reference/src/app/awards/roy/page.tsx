import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getROYHistory } from '@/lib/queries/awards';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function ROYPage(): React.JSX.Element {
  const winners = getROYHistory();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href={'/awards' as Route} className="text-link mb-2 inline-block hover:underline">
          ← All Awards
        </Link>
        <h1 className="text-3xl font-bold text-heading">Rookie of the Year (ROY)</h1>
        <p className="text-muted mt-1">The Wilt Chamberlain Trophy - NBA ROY Award Winners</p>
      </div>

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">ROY Winners by Season</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Season</th>
                <th className={tableHeaderCellClass('left')}>Player</th>
                <th className={tableHeaderCellClass('left')}>Team</th>
                <th className={tableHeaderCellClass('right')}>Votes</th>
                <th className={tableHeaderCellClass('right')}>Vote %</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((winner, index) => (
                <tr
                  key={winner['season_id'] as string}
                  className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>
                    {winner['start_year'] as number}-{winner['end_year'] as number}
                  </td>
                  <td className={tableCellClass('left')}>
                    <Link
                      href={`/players/${(winner['bref_id'] as string).slice(0, 1).toLowerCase()}/${winner['bref_id']}` as Route}
                      className={tableLinkClass}
                    >
                      {winner['full_name'] as string}
                    </Link>
                  </td>
                  <td className={tableCellClass('left')}>
                    {winner['team_abbrev'] ? (
                      <Link
                        href={`/teams/${winner['team_abbrev']}` as Route}
                        className={tableLinkClass}
                      >
                        {winner['team_abbrev'] as string}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className={tableCellClass('right')}>
                    {winner['votes_received'] ?? '-'}
                  </td>
                  <td className={tableCellClass('right')}>
                    {winner['vote_percentage'] ? `${winner['vote_percentage']}%` : '-'}
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
