import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getFranchiseHistory,
  getFranchiseSeasons,
  getFranchiseChampionships,
  getCurrentFranchiseInfo,
} from '@/lib/queries/franchise';
import { getTeamByAbbrev } from '@/lib/queries/teams';
import { validateTeamAbbrev } from '@/lib/validation';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

interface FranchisePageProps {
  params: Promise<{
    abbrev: string;
  }>;
}

export default async function FranchisePage({
  params,
}: FranchisePageProps): Promise<React.JSX.Element> {
  const { abbrev } = await params;
  
  const teamAbbrev = validateTeamAbbrev(abbrev.toUpperCase());
  const team = getTeamByAbbrev(teamAbbrev);
  
  if (!team) {
    notFound();
  }
  
  const currentInfo = getCurrentFranchiseInfo(teamAbbrev);
  const history = getFranchiseHistory(teamAbbrev);
  const seasons = getFranchiseSeasons(teamAbbrev);
  const championships = getFranchiseChampionships(teamAbbrev);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link
          href={`/teams/${teamAbbrev}` as Route}
          className="text-link mb-2 inline-block hover:underline"
        >
          ← Back to {team.full_name}
        </Link>
        <h1 className="text-3xl font-bold text-heading">Franchise History</h1>
        {currentInfo && (
          <p className="text-muted mt-1">
            Founded: {currentInfo.founded} | Conference: {currentInfo.conference ?? 'N/A'} | Division: {currentInfo.division ?? 'N/A'}
          </p>
        )}
      </div>

      {championships.length > 0 && (
        <section className="panel-paper mb-6 p-4">
          <h2 className="mb-3 text-xl font-bold text-heading">Championships ({championships.length})</h2>
          <div className="flex flex-wrap gap-2">
            {championships.map((champ) => (
              <span
                key={champ.season_id}
                className="rounded bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800"
              >
                {champ.year}
              </span>
            ))}
          </div>
        </section>
      )}

      {history.length > 1 && (
        <section className="panel-paper mb-6 p-4">
          <h2 className="mb-3 text-xl font-bold text-heading">Team Name History</h2>
          <div className={tableContainerClass}>
            <table className={tableClass}>
              <thead>
                <tr className={tableHeadRowClass}>
                  <th className={tableHeaderCellClass('left')}>Years</th>
                  <th className={tableHeaderCellClass('left')}>Team Name</th>
                  <th className={tableHeaderCellClass('left')}>League</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr
                    key={entry.season_founded}
                    className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                  >
                    <td className={tableCellClass('left')}>
                      {entry.season_founded}-{entry.season_active_till}
                    </td>
                    <td className={tableCellClass('left')}>
                      {entry.team_city} {entry.team_name}
                    </td>
                    <td className={tableCellClass('left')}>{entry.league}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">Season-by-Season History</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Season</th>
                <th className={tableHeaderCellClass('right')}>W</th>
                <th className={tableHeaderCellClass('right')}>L</th>
                <th className={tableHeaderCellClass('right')}>W/L%</th>
                <th className={tableHeaderCellClass('left')}>Playoffs</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season, index) => (
                <tr
                  key={season.season_id}
                  className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>
                    <Link
                      href={`/teams/${teamAbbrev}/${season['end_year']}` as Route}
                      className={tableLinkClass}
                    >
                      {season['start_year']}-{season['end_year']}
                    </Link>
                  </td>
                  <td className={tableCellClass('right')}>{season.wins}</td>
                  <td className={tableCellClass('right')}>{season.losses}</td>
                  <td className={tableCellClass('right')}>{season.win_pct}%</td>
                  <td className={tableCellClass('left')}>{season.playoffs ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
