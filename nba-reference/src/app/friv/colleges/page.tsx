import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
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

export default function CollegesPage(): React.JSX.Element {
  const colleges = getPlayersByCollege();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">NBA Players by College</h1>
      <p className="mb-5 text-sm text-muted">
        Colleges that have produced NBA players, ranked by number of alumni.
      </p>

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">All Colleges ({colleges.length})</h2>
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
              {colleges.slice(0, 100).map((college, index) => {
                const playerIds = college.players.split(',').slice(0, 3);

                return (
                  <tr
                    key={college.college}
                    className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                  >
                    <td className={tableCellClass('left')}>{index + 1}</td>
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
      </section>
    </main>
  );
}
