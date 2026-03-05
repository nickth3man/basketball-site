import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getSeasonList } from '@/lib/queries';
import { seasonIdToLeagueSlug } from '@/lib/season-utils';
import {
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function LeaguesPage(): React.JSX.Element {
  const seasons = getSeasonList(40);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Leagues</h1>
      <p className="mb-4 text-sm text-muted-strong">NBA season index (Basketball Reference style).</p>
      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass('left')}>Season</th>
              <th className={tableHeaderCellClass('left')}>League URL</th>
              <th className={tableHeaderCellClass('left')}>Start</th>
              <th className={tableHeaderCellClass('left')}>End</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season, seasonIndex) => {
              const leagueSlug = seasonIdToLeagueSlug(season.season_id) ?? season.season_id;

              return (
                <tr
                  key={season.season_id}
                  className={seasonIndex % 2 === 0 ? 'bg-white' : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>{season.season_id}</td>
                  <td className={tableCellClass('left')}>
                    <Link
                      className={tableLinkClass}
                      href={`/leagues/${leagueSlug}` as Route}
                    >
                      {leagueSlug}
                    </Link>
                  </td>
                  <td className={tableCellClass('left')}>{season.start_year}</td>
                  <td className={tableCellClass('left')}>{season.end_year}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
