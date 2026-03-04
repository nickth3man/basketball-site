/**
 * @fileoverview Seasons directory page - lists all NBA seasons.
 *
 * Displays a chronological list of NBA seasons with:
 * - Season ID (e.g., "2024-25")
 * - Start year
 * - End year
 *
 * Seasons are ordered by start year (newest first) with links
 * to individual season detail pages.
 *
 * @module @/app/seasons/page
 */

import type React from 'react';
import Link from 'next/link';
import { getSeasonList } from '@/lib/queries';
import {
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

/**
 * Render the Seasons directory page listing NBA seasons in a table with links to each season's detail page.
 *
 * Fetches up to 40 seasons and displays them in descending start-year order; each row links to the corresponding season detail page.
 *
 * @returns The Seasons directory page JSX element
 */
export default function SeasonsPage(): React.JSX.Element {
  const seasons = getSeasonList(40);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Seasons</h1>
      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass('left')}>Season</th>
              <th className={tableHeaderCellClass('left')}>Start</th>
              <th className={tableHeaderCellClass('left')}>End</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season, seasonIndex) => (
              <tr
                key={season.season_id}
                className={seasonIndex % 2 === 0 ? 'bg-white' : 'bg-row-alt'}
              >
                <td className={tableCellClass('left')}>
                  <Link className={tableLinkClass} href={`/seasons/${season.season_id}`}>
                    {season.season_id}
                  </Link>
                </td>
                <td className={tableCellClass('left')}>{season.start_year}</td>
                <td className={tableCellClass('left')}>{season.end_year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
