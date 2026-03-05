import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  getStandingsAsOfDate,
  getMostRecentGameDate,
  getCurrentSeasonId,
  type TeamStandingRow,
} from '@/lib/queries/standings';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

interface StandingsPageProps {
  searchParams?: Promise<{
    date?: string;
  }>;
}

function ConferenceTable({
  title,
  teams,
}: {
  title: string;
  teams: TeamStandingRow[];
}): React.JSX.Element {
  return (
    <section className="panel-paper p-4">
      <h2 className="mb-3 text-xl font-bold text-heading">{title}</h2>
      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass('left')}>Team</th>
              <th className={tableHeaderCellClass('right')}>W</th>
              <th className={tableHeaderCellClass('right')}>L</th>
              <th className={tableHeaderCellClass('right')}>W/L%</th>
              <th className={tableHeaderCellClass('right')}>GB</th>
              <th className={tableHeaderCellClass('right')}>PS/G</th>
              <th className={tableHeaderCellClass('right')}>PA/G</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr
                key={team.team_abbrev}
                className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
              >
                <td className={tableCellClass('left')}>
                  <Link href={`/teams/${team.team_abbrev}` as Route} className={tableLinkClass}>
                    {team.team_name}
                  </Link>
                </td>
                <td className={tableCellClass('right')}>{team.w}</td>
                <td className={tableCellClass('right')}>{team.l}</td>
                <td className={tableCellClass('right')}>
                  {(team.win_pct * 100).toFixed(1)}%
                </td>
                <td className={tableCellClass('right')}>{team.gb ?? '-'}</td>
                <td className={tableCellClass('right')}>{team.ps_g ?? '-'}</td>
                <td className={tableCellClass('right')}>{team.pa_g ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function StandingsPage({
  searchParams,
}: StandingsPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const seasonId = getCurrentSeasonId();
  const mostRecentDate = getMostRecentGameDate(seasonId);
  
  const selectedDate = params?.date ?? mostRecentDate ?? new Date().toISOString().split('T')[0];
  
  if (!selectedDate) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
        <h1 className="text-3xl font-bold text-heading">Standings by Date</h1>
        <p className="mt-4 text-muted">No date available for standings.</p>
      </main>
    );
  }
  
  const standings = getStandingsAsOfDate(selectedDate, seasonId);
  
  const eastTeams = standings.filter((t) => t.conference === 'East');
  const westTeams = standings.filter((t) => t.conference === 'West');

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">Standings by Date</h1>
      <p className="mb-5 text-sm text-muted">
        View NBA standings as of any date during the season.
      </p>

      <section className="panel-paper mb-6 p-4">
        <form className="flex items-center gap-4">
          <label htmlFor="date" className="text-sm font-medium">Select Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            defaultValue={selectedDate}
            className="rounded border border-line px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Update Standings
          </button>
        </form>
        <p className="mt-2 text-xs text-muted">
          Current: {selectedDate} | Season: {seasonId}
        </p>
      </section>

      <Suspense fallback={<div className="text-center py-8">Loading standings...</div>}>
        <div className="grid gap-6 lg:grid-cols-2">
          <ConferenceTable title="Eastern Conference" teams={eastTeams} />
          <ConferenceTable title="Western Conference" teams={westTeams} />
        </div>
      </Suspense>
    </main>
  );
}
