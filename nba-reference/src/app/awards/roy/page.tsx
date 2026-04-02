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
  const allCandidates = getROYHistory();
  const seenSeasons = new Set<string>();
  const winners = allCandidates.filter(w => {
    if (seenSeasons.has(w.season_id)) return false;
    seenSeasons.add(w.season_id);
    return true;
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href={'/awards' as Route} className="mb-2 inline-block text-link hover:underline">
          ← All Awards
        </Link>
        <h1 className="text-3xl font-bold text-heading">Rookie of the Year (ROY)</h1>
        <p className="mt-1 text-muted">The Wilt Chamberlain Trophy - NBA ROY Award Winners</p>
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
                <th className={tableHeaderCellClass('left')}>Voting</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((winner, index) => (
                <tr
                  key={`${winner.season_id}-${winner.bref_id}`}
                  className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>
                    {winner.start_year}-{winner.end_year}
                  </td>
                  <td className={tableCellClass('left')}>
                    <Link
                      href={
                        `/players/${winner.bref_id.slice(0, 1).toLowerCase()}/${winner.bref_id}` as Route
                      }
                      className={tableLinkClass}
                    >
                      {winner.full_name}
                    </Link>
                  </td>
                  <td className={tableCellClass('left')}>
                    {winner.team_abbrev == null ? (
                      '-'
                    ) : (
                      <Link
                        href={`/teams/${winner.team_abbrev}` as Route}
                        className={tableLinkClass}
                      >
                        {winner.team_abbrev}
                      </Link>
                    )}
                  </td>
                  <td className={tableCellClass('right')}>{winner.votes_received ?? '-'}</td>
                  <td className={tableCellClass('right')}>
                    {winner.vote_percentage == null ? '-' : `${String(winner.vote_percentage)}%`}
                  </td>
                  <td className={tableCellClass('left')}>
                    <Link
                      href={`/awards/roy/${winner.season_id}` as Route}
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
