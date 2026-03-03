/**
 * @fileoverview Teams directory page - lists all NBA teams.
 *
 * Displays a list of all NBA teams with:
 * - Team name and abbreviation
 * - Conference (East/West)
 * - Division
 *
 * Teams are sorted alphabetically by full name.
 *
 * @module @/app/teams/page
 */

import type React from 'react';
import Link from 'next/link';
import { getTeamDirectory } from '@/lib/query/directory';
import {
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

/**
 * Render the Teams directory page.
 *
 * Displays a table of NBA teams where each row shows the team's full name (with abbreviation), conference, and division, and links the team name to its detail page.
 *
 * @returns The Teams directory page JSX element
 */
export default function TeamsPage(): React.JSX.Element {
  const teams = getTeamDirectory();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Teams</h1>
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
            {teams.map((team, teamIndex) => (
              <tr
                key={team.abbreviation}
                className={teamIndex % 2 === 0 ? 'bg-white' : 'bg-row-alt'}
              >
                <td className={tableCellClass('left')}>
                  <Link className={tableLinkClass} href={`/teams/${team.abbreviation}`}>
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
    </main>
  );
}
