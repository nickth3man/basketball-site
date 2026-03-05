import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlayoffSeriesBySeason, getNBAFinals, getPlayoffLeaders } from '@/lib/queries/playoffs';
import { parseSeasonTokenToSeasonId } from '@/lib/season-utils';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

interface PlayoffSeasonPageProps {
  params: Promise<{
    season: string;
  }>;
}

export default async function PlayoffSeasonPage({
  params,
}: PlayoffSeasonPageProps): Promise<React.JSX.Element> {
  const { season } = await params;
  const seasonId = parseSeasonTokenToSeasonId(season);

  if (seasonId == null) {
    notFound();
  }

  const series = getPlayoffSeriesBySeason(seasonId);
  const finals = getNBAFinals(seasonId);
  const scoringLeaders = getPlayoffLeaders(seasonId, 'pts', 5);
  const reboundLeaders = getPlayoffLeaders(seasonId, 'reb', 5);
  const assistLeaders = getPlayoffLeaders(seasonId, 'ast', 5);

  if (series.length === 0) {
    notFound();
  }

  const eastTeams = new Set([
    'BOS',
    'BRK',
    'NYK',
    'PHI',
    'TOR',
    'CHI',
    'CLE',
    'IND',
    'DET',
    'MIL',
    'ATL',
    'CHO',
    'MIA',
    'ORL',
    'WAS',
  ]);
  const westTeams = new Set([
    'DEN',
    'MIN',
    'OKC',
    'POR',
    'UTA',
    'GSW',
    'LAC',
    'LAL',
    'PHO',
    'SAC',
    'DAL',
    'HOU',
    'MEM',
    'NOP',
    'SAS',
  ]);

  const eastSeries = series.filter(
    s => eastTeams.has(s.home_abbrev) && eastTeams.has(s.away_abbrev)
  );
  const westSeries = series.filter(
    s => westTeams.has(s.home_abbrev) && westTeams.has(s.away_abbrev)
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href={'/playoffs' as Route} className="mb-2 inline-block text-link hover:underline">
          ← All Playoffs
        </Link>
        <h1 className="text-3xl font-bold text-heading">{seasonId} NBA Playoffs</h1>
        {finals == null ? null : (
          <p className="mt-1 text-muted">
            Champion:{' '}
            <Link
              href={`/teams/${finals.winner_abbrev}` as Route}
              className="font-semibold text-link"
            >
              {finals.winner_abbrev}
            </Link>{' '}
            ({finals.home_wins}-{finals.away_wins} in Finals)
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {finals == null ? null : (
            <section className="mb-6 panel-paper p-4">
              <h2 className="mb-3 text-xl font-bold text-heading">NBA Finals</h2>
              <div className="flex items-center justify-between rounded bg-gray-50 p-4">
                <div className="text-center">
                  <Link
                    href={`/teams/${finals.home_abbrev}` as Route}
                    className="text-lg font-semibold text-link"
                  >
                    {finals.home_abbrev}
                  </Link>
                  <p className="text-sm text-muted">{finals.home_name}</p>
                  <p className="text-2xl font-bold">{finals.home_wins}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted">Best of 7</p>
                  {finals.home_wins >= 4 || finals.away_wins >= 4 ? (
                    <p className="text-xs text-green-600">Final</p>
                  ) : (
                    <p className="text-xs text-orange-600">In Progress</p>
                  )}
                </div>
                <div className="text-center">
                  <Link
                    href={`/teams/${finals.away_abbrev}` as Route}
                    className="text-lg font-semibold text-link"
                  >
                    {finals.away_abbrev}
                  </Link>
                  <p className="text-sm text-muted">{finals.away_name}</p>
                  <p className="text-2xl font-bold">{finals.away_wins}</p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <Link
                  href={`/boxscores/${finals.series_id}` as Route}
                  className="text-sm text-link hover:underline"
                >
                  View Finals Game 1 Box Score →
                </Link>
              </div>
            </section>
          )}
          {eastSeries.length > 0 && (
            <section className="mb-6 panel-paper p-4">
              <h2 className="mb-3 text-xl font-bold text-heading">Eastern Conference</h2>
              <div className={tableContainerClass}>
                <table className={tableClass}>
                  <thead>
                    <tr className={tableHeadRowClass}>
                      <th className={tableHeaderCellClass('left')}>Series</th>
                      <th className={tableHeaderCellClass('left')}>Result</th>
                      <th className={tableHeaderCellClass('left')}>Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eastSeries.map((s, index) => (
                      <tr
                        key={`${s.home_abbrev}-${s.away_abbrev}`}
                        className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                      >
                        <td className={tableCellClass('left')}>
                          <Link
                            href={`/teams/${s.home_abbrev}` as Route}
                            className={tableLinkClass}
                          >
                            {s.home_abbrev}
                          </Link>
                          {' vs '}
                          <Link
                            href={`/teams/${s.away_abbrev}` as Route}
                            className={tableLinkClass}
                          >
                            {s.away_abbrev}
                          </Link>
                        </td>
                        <td className={tableCellClass('left')}>
                          {s.home_wins}-{s.away_wins}
                        </td>
                        <td className={tableCellClass('left')}>
                          <Link
                            href={`/teams/${s.winner_abbrev}` as Route}
                            className="font-medium text-link"
                          >
                            {s.winner_abbrev}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {westSeries.length > 0 && (
            <section className="mb-6 panel-paper p-4">
              <h2 className="mb-3 text-xl font-bold text-heading">Western Conference</h2>
              <div className={tableContainerClass}>
                <table className={tableClass}>
                  <thead>
                    <tr className={tableHeadRowClass}>
                      <th className={tableHeaderCellClass('left')}>Series</th>
                      <th className={tableHeaderCellClass('left')}>Result</th>
                      <th className={tableHeaderCellClass('left')}>Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {westSeries.map((s, index) => (
                      <tr
                        key={`${s.home_abbrev}-${s.away_abbrev}`}
                        className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                      >
                        <td className={tableCellClass('left')}>
                          <Link
                            href={`/teams/${s.home_abbrev}` as Route}
                            className={tableLinkClass}
                          >
                            {s.home_abbrev}
                          </Link>
                          {' vs '}
                          <Link
                            href={`/teams/${s.away_abbrev}` as Route}
                            className={tableLinkClass}
                          >
                            {s.away_abbrev}
                          </Link>
                        </td>
                        <td className={tableCellClass('left')}>
                          {s.home_wins}-{s.away_wins}
                        </td>
                        <td className={tableCellClass('left')}>
                          <Link
                            href={`/teams/${s.winner_abbrev}` as Route}
                            className="font-medium text-link"
                          >
                            {s.winner_abbrev}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="panel-paper p-4">
            <h3 className="mb-3 text-lg font-semibold text-heading">Playoff Scoring Leaders</h3>
            <div className={tableContainerClass}>
              <table className={tableClass}>
                <thead>
                  <tr className={tableHeadRowClass}>
                    <th className={tableHeaderCellClass('left')}>Player</th>
                    <th className={tableHeaderCellClass('right')}>PTS</th>
                    <th className={tableHeaderCellClass('right')}>G</th>
                  </tr>
                </thead>
                <tbody>
                  {scoringLeaders.map((player, index) => (
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
                      <td className={tableCellClass('right')}>{player.total_pts}</td>
                      <td className={tableCellClass('right')}>{player.games}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel-paper p-4">
            <h3 className="mb-3 text-lg font-semibold text-heading">Playoff Rebound Leaders</h3>
            <div className={tableContainerClass}>
              <table className={tableClass}>
                <thead>
                  <tr className={tableHeadRowClass}>
                    <th className={tableHeaderCellClass('left')}>Player</th>
                    <th className={tableHeaderCellClass('right')}>REB</th>
                    <th className={tableHeaderCellClass('right')}>G</th>
                  </tr>
                </thead>
                <tbody>
                  {reboundLeaders.map((player, index) => (
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
                      <td className={tableCellClass('right')}>{player.total_reb}</td>
                      <td className={tableCellClass('right')}>{player.games}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel-paper p-4">
            <h3 className="mb-3 text-lg font-semibold text-heading">Playoff Assist Leaders</h3>
            <div className={tableContainerClass}>
              <table className={tableClass}>
                <thead>
                  <tr className={tableHeadRowClass}>
                    <th className={tableHeaderCellClass('left')}>Player</th>
                    <th className={tableHeaderCellClass('right')}>AST</th>
                    <th className={tableHeaderCellClass('right')}>G</th>
                  </tr>
                </thead>
                <tbody>
                  {assistLeaders.map((player, index) => (
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
                      <td className={tableCellClass('right')}>{player.total_ast}</td>
                      <td className={tableCellClass('right')}>{player.games}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
