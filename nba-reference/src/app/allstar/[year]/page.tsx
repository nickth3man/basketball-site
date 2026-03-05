import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllStarRosters, getAllStarMVP } from '@/lib/queries/allstar';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

interface AllStarYearPageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function AllStarYearPage({
  params,
}: AllStarYearPageProps): Promise<React.JSX.Element> {
  const { year } = await params;

  // Parse year (e.g., "24" -> "2023-24")
  const fullYear = year.length === 2 ? `20${year}` : year;
  const seasonId = `${parseInt(fullYear, 10) - 1}-${year.slice(-2)}`;

  const rosters = getAllStarRosters(seasonId);
  const mvp = getAllStarMVP(seasonId);

  if (rosters.teams.length === 0) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href={'/allstar' as Route} className="mb-2 inline-block text-link hover:underline">
          ← All All-Star Games
        </Link>
        <h1 className="text-3xl font-bold text-heading">{seasonId} NBA All-Star Game</h1>
        {mvp == null ? null : (
          <p className="mt-1 text-muted">
            MVP:{' '}
            <Link
              href={`/players/${mvp.bref_id.slice(0, 1).toLowerCase()}/${mvp.bref_id}` as Route}
              className="font-semibold text-link"
            >
              {mvp.full_name}
            </Link>
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {rosters.teams.map(team => (
          <section key={team.team_name} className="panel-paper p-4">
            <h2 className="mb-3 text-xl font-bold text-heading">{team.team_name}</h2>
            <div className={tableContainerClass}>
              <table className={tableClass}>
                <thead>
                  <tr className={tableHeadRowClass}>
                    <th className={tableHeaderCellClass('left')}>Player</th>
                    <th className={tableHeaderCellClass('left')}>Team</th>
                    <th className={tableHeaderCellClass('left')}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {team.players.map((player, index) => (
                    <tr
                      key={player.bref_id}
                      className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                    >
                      <td className={tableCellClass('left')}>
                        <Link
                          href={
                            `/players/${player.bref_id.slice(0, 1).toLowerCase()}/${player.bref_id}` as Route
                          }
                          className={tableLinkClass}
                        >
                          {player.full_name}
                        </Link>
                      </td>
                      <td className={tableCellClass('left')}>{player.team_abbrev ?? '-'}</td>
                      <td className={tableCellClass('left')}>
                        {player.is_starter === 1 ? (
                          <span className="font-semibold text-green-600">Starter</span>
                        ) : player.is_replacement === 1 ? (
                          <span className="text-orange-600">Replacement</span>
                        ) : (
                          <span className="text-muted">Reserve</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
