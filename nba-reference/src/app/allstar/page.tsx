import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getAllStarSeasons, getAllStarMVPs } from '@/lib/queries/allstar';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function AllStarPage(): React.JSX.Element {
  const seasons = getAllStarSeasons();
  const mvps = getAllStarMVPs().slice(0, 10);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">NBA All-Star Games</h1>
      <p className="mb-5 text-sm text-muted">
        Historical All-Star game rosters, MVPs, and selections.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section className="panel-paper p-4">
            <h2 className="mb-3 text-xl font-bold text-heading">All-Star Seasons</h2>
            <div className={tableContainerClass}>
              <table className={tableClass}>
                <thead>
                  <tr className={tableHeadRowClass}>
                    <th className={tableHeaderCellClass('left')}>Season</th>
                    <th className={tableHeaderCellClass('left')}>Year</th>
                    <th className={tableHeaderCellClass('right')}>Players</th>
                    <th className={tableHeaderCellClass('left')}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((season, index) => (
                    <tr
                      key={season['season_id'] as string}
                      className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                    >
                      <td className={tableCellClass('left')}>
                        <Link
                          href={`/allstar/${(season['end_year'] as number).toString().slice(-2)}` as Route}
                          className={tableLinkClass}
                        >
                          {season['season_id'] as string} All-Star Game
                        </Link>
                      </td>
                      <td className={tableCellClass('left')}>
                        {season['start_year'] as number}-{season['end_year'] as number}
                      </td>
                      <td className={tableCellClass('right')}>{season['player_count'] as number}</td>
                      <td className={tableCellClass('left')}>
                        <Link
                          href={`/allstar/${(season['end_year'] as number).toString().slice(-2)}` as Route}
                          className="text-link hover:underline"
                        >
                          View Roster →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div>
          <section className="panel-paper p-4">
            <h2 className="mb-3 text-xl font-bold text-heading">Recent All-Star MVPs</h2>
            <div className={tableContainerClass}>
              <table className={tableClass}>
                <thead>
                  <tr className={tableHeadRowClass}>
                    <th className={tableHeaderCellClass('left')}>Year</th>
                    <th className={tableHeaderCellClass('left')}>Player</th>
                    <th className={tableHeaderCellClass('left')}>Team</th>
                  </tr>
                </thead>
                <tbody>
                  {mvps.map((mvp, index) => (
                    <tr
                      key={mvp['season_id'] as string}
                      className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                    >
                      <td className={tableCellClass('left')}>{mvp['end_year'] as number}</td>
                      <td className={tableCellClass('left')}>
                        <Link
                          href={`/players/${(mvp['bref_id'] as string).slice(0, 1).toLowerCase()}/${mvp['bref_id']}` as Route}
                          className={tableLinkClass}
                        >
                          {mvp['full_name'] as string}
                        </Link>
                      </td>
                      <td className={tableCellClass('left')}>{mvp['team_abbrev'] ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>          </section>
        </div>
      </div>
    </main>
  );
}
