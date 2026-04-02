/**
 * @fileoverview G-League teams directory page.
 *
 * Shows an empty state since G-League team data is not yet available.
 *
 * @module @/app/gleague/teams/page
 */

import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getGLeagueTeamDirectory } from '@/lib/queries';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

/**
 * Renders the G-League teams directory.
 *
 * @returns The G-League teams directory page JSX element
 */
export default function GLeagueTeamsPage(): React.JSX.Element {
  const teams = getGLeagueTeamDirectory();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted">
        <Link href={'/gleague' as Route} className="hover:underline">
          G-League
        </Link>
        {' / Teams'}
      </nav>
      <h1 className="mb-3 inscription-title text-2xl">G-League Teams</h1>
      {teams.length === 0 ? (
        <div className="bg-surface-container rounded-lg border border-dashed border-muted/40 px-6 py-12 text-center">
          <p className="mb-2 text-lg font-semibold text-heading">No Teams Yet</p>
          <p className="text-sm text-muted">
            G-League team data has not been loaded yet. Data will be available once the ETL pipeline
            has been run for G-League seasons.
          </p>
        </div>
      ) : (
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Team</th>
                <th className={tableHeaderCellClass('left')}>Conf</th>
                <th className={tableHeaderCellClass('left')}>Div</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.abbreviation} className={tableBodyRowClass}>
                  <td className={tableCellClass('left')}>
                    <Link
                      className={tableLinkClass}
                      href={`/gleague/teams/${team.abbreviation}` as Route}
                    >
                      {team.full_name} ({team.abbreviation})
                    </Link>
                  </td>
                  <td className={tableCellClass('left')}>{team.conference ?? '-'}</td>
                  <td className={tableCellClass('left')}>{team.division ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
