import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getDraftSeasons } from '@/lib/queries';
import { seasonIdToLeagueSlug } from '@/lib/season-utils';
import {
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export default function DraftPage(): React.JSX.Element {
  const seasons = getDraftSeasons(60);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Draft</h1>
      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass('left')}>Season</th>
              <th className={tableHeaderCellClass('left')}>Draft Page</th>
              <th className={tableHeaderCellClass('left')}>Start</th>
              <th className={tableHeaderCellClass('left')}>End</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season, seasonIndex) => {
              const slug = seasonIdToLeagueSlug(season.season_id);
              const draftSlug = slug == null ? season.season_id : slug;

              return (
                <tr
                  key={season.season_id}
                  className={seasonIndex % 2 === 0 ? 'bg-white' : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>{season.season_id}</td>
                  <td className={tableCellClass('left')}>
                    <Link
                      className={tableLinkClass}
                      href={`/draft/${draftSlug}` as Route}
                    >
                      {draftSlug}
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
