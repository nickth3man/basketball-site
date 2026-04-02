/**
 * @fileoverview G-League homepage.
 *
 * Displays the G-League overview with a coming-soon message since
 * G-League data has not yet been populated via ETL.
 *
 * @module @/app/gleague/page
 */

import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import {
  getGLeagueTeamDirectory,
  getGLeagueLatestSeasonId,
  getGLeagueSeasonLeaders,
} from '@/lib/queries';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

const ACCENT = '#1a6b3a';
const ACCENT_BG = 'rgba(26,107,58,0.06)';

/**
 * Renders the G-League homepage.
 *
 * @returns The G-League homepage JSX element
 */
export default function GLeaguePage(): React.JSX.Element {
  const teams = getGLeagueTeamDirectory();
  const latestSeason = getGLeagueLatestSeasonId();
  const leaders = latestSeason != null ? getGLeagueSeasonLeaders(latestSeason, 'pts', 10, 5) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* Hero Banner */}
      <div
        className="mb-8 rounded-xl px-6 py-8"
        style={{ background: ACCENT_BG, borderLeft: `4px solid ${ACCENT}` }}
      >
        <h1 className="mb-2 inscription-title text-3xl" style={{ color: ACCENT }}>
          G-League
        </h1>
        <p className="mb-4 text-sm text-muted">
          NBA G-League — player development and statistics for the NBA&apos;s official minor league.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={'/gleague/players' as Route} className={tableLinkClass}>
            Players Directory
          </Link>
          <Link href={'/gleague/teams' as Route} className={tableLinkClass}>
            Teams Directory
          </Link>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-surface-container mb-8 rounded-lg border border-dashed border-muted/40 px-6 py-8 text-center">
        <p className="mb-2 text-lg font-semibold text-heading">Data Coming Soon</p>
        <p className="text-sm text-muted">
          G-League statistics are not yet available. Data will be populated via ETL pipeline. Check
          back later for full coverage of players, teams, and season stats.
        </p>
      </div>

      {/* Stat Leaders */}
      <section className="mb-8">
        <h2 className="mb-3 inscription-title text-xl">Season Leaders</h2>
        {leaders.length === 0 ? (
          <p className="text-sm text-muted">No G-League stat leaders available yet.</p>
        ) : (
          <div className={tableContainerClass}>
            <table className={tableClass}>
              <thead>
                <tr className={tableHeadRowClass}>
                  <th className={tableHeaderCellClass('left')}>Player</th>
                  <th className={tableHeaderCellClass('left')}>Team</th>
                  <th className={tableHeaderCellClass('right')}>G</th>
                  <th className={tableHeaderCellClass('right')}>PTS/G</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map(row => (
                  <tr key={row.bref_id} className={tableBodyRowClass}>
                    <td className={tableCellClass('left')}>{row.full_name}</td>
                    <td className={tableCellClass('left')}>{row.team ?? '-'}</td>
                    <td className={tableCellClass('right')}>{row.g}</td>
                    <td className={tableCellClass('right')}>{row.stat_per_game ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Team Directory */}
      <section>
        <h2 className="mb-3 inscription-title text-xl">Teams</h2>
        {teams.length === 0 ? (
          <p className="text-sm text-muted">No G-League teams available yet.</p>
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
      </section>
    </main>
  );
}
