import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTeamSchedule, type TeamScheduleGame } from '@/lib/queries/team-schedule';
import { getTeamByAbbrev } from '@/lib/queries/teams';
import { validateTeamAbbrev, validateSeasonId } from '@/lib/validation';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

interface TeamSchedulePageProps {
  params: Promise<{
    abbrev: string;
    season: string;
  }>;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function groupByMonth(games: TeamScheduleGame[]): Array<{
  month: string;
  games: TeamScheduleGame[];
}> {
  const groups = new Map<string, TeamScheduleGame[]>();
  
  for (const game of games) {
    const date = new Date(game.game_date);
    const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!groups.has(monthKey)) {
      groups.set(monthKey, []);
    }
    groups.get(monthKey)!.push(game);
  }
  
  return Array.from(groups.entries()).map(([month, games]) => ({
    month,
    games,
  }));
}

export default async function TeamSchedulePage({
  params,
}: TeamSchedulePageProps): Promise<React.JSX.Element> {
  const { abbrev, season } = await params;
  
  const teamAbbrev = validateTeamAbbrev(abbrev.toUpperCase());
  const seasonId = validateSeasonId(season);
  
  const team = getTeamByAbbrev(teamAbbrev);
  if (!team) {
    notFound();
  }
  
  const schedule = getTeamSchedule(teamAbbrev, seasonId);
  const groupedGames = groupByMonth(schedule);
  
  // Calculate record after each game
  let wins = 0;
  let losses = 0;
  const gamesWithRecord = schedule.map((game) => {
    if (game.result === 'W') wins++;
    if (game.result === 'L') losses++;
    return {
      ...game,
      record: game.result === 'Scheduled' ? '-' : `${wins}-${losses}`,
    };
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link
          href={`/teams/${teamAbbrev}` as Route}
          className="text-link mb-2 inline-block hover:underline"
        >
          ← Back to {team.full_name}
        </Link>
        <h1 className="text-3xl font-bold text-heading">{seasonId} Schedule</h1>
        <p className="text-muted mt-1">
          {schedule.filter((g) => g.result === 'W').length} - {schedule.filter((g) => g.result === 'L').length} Record
        </p>
      </div>

      {groupedGames.map(({ month, games }) => (
        <section key={month} className="panel-paper mb-6 p-4">
          <h2 className="mb-3 text-lg font-bold text-heading">{month}</h2>
          <div className={tableContainerClass}>
            <table className={tableClass}>
              <thead>
                <tr className={tableHeadRowClass}>
                  <th className={tableHeaderCellClass('left')}>Date</th>
                  <th className={tableHeaderCellClass('left')}>Opponent</th>
                  <th className={tableHeaderCellClass('left')}>Location</th>
                  <th className={tableHeaderCellClass('left')}>Result</th>
                  <th className={tableHeaderCellClass('left')}>Record</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, index) => (
                  <tr
                    key={game.game_id}
                    className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                  >
                    <td className={tableCellClass('left')}>{formatDate(game.game_date)}</td>
                    <td className={tableCellClass('left')}>
                      <Link
                        href={`/teams/${game.opponent_abbrev}` as Route}
                        className={tableLinkClass}
                      >
                        {game.opponent_name}
                      </Link>
                    </td>
                    <td className={tableCellClass('left')}>
                      <span
                        className={
                          game.location === 'Home'
                            ? 'text-green-600 font-medium'
                            : 'text-orange-600 font-medium'
                        }
                      >
                        {game.location}
                      </span>
                    </td>
                    <td className={tableCellClass('left')}>
                      {game.result === 'Scheduled' ? (
                        <span className="text-muted">Scheduled</span>
                      ) : (
                        <Link
                          href={`/boxscores/${game.game_id}` as Route}
                          className={
                            game.result === 'W'
                              ? 'text-green-600 font-semibold hover:underline'
                              : 'text-red-600 font-semibold hover:underline'
                          }
                        >
                          {game.result} ({game.team_score} - {game.opp_score})
                        </Link>
                      )}
                    </td>
                    <td className={tableCellClass('left')}>
                      {gamesWithRecord.find((g) => g.game_id === game.game_id)?.record ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  );
}
