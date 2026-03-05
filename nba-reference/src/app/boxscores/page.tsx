import type React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
  getCompletedGamesByDate,
  getLatestCompletedGameDate,
  getNextCompletedGameDate,
  getPreviousCompletedGameDate,
} from '@/lib/query/boxscores';
import {
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function BoxscoresPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}): Promise<React.JSX.Element> {
  const latestDate = getLatestCompletedGameDate();
  if (latestDate == null) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-3 text-2xl font-bold">Box Scores</h1>
        <p className="text-sm text-muted-strong">No completed games available.</p>
      </main>
    );
  }

  const resolvedSearchParams = await searchParams;
  const requestedDate = resolvedSearchParams.date;
  const selectedDate =
    requestedDate != null && isIsoDate(requestedDate) ? requestedDate : latestDate;

  const games = getCompletedGamesByDate(selectedDate);
  const safeDate = games.length > 0 ? selectedDate : latestDate;
  const safeGames = games.length > 0 ? games : getCompletedGamesByDate(latestDate);

  const previousDate = getPreviousCompletedGameDate(safeDate);
  const nextDate = getNextCompletedGameDate(safeDate);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold">Box Scores</h1>
      <p className="mb-3 text-sm text-muted-strong">Games played on {safeDate}.</p>
      <div className="mb-4 flex items-center gap-2 text-sm">
        {previousDate == null ? (
          <span className="rounded border border-line px-2 py-1 text-muted">Previous</span>
        ) : (
          <Link className={tableLinkClass} href={`/boxscores?date=${previousDate}` as Route}>
            Previous ({previousDate})
          </Link>
        )}
        {nextDate == null ? (
          <span className="rounded border border-line px-2 py-1 text-muted">Next</span>
        ) : (
          <Link className={tableLinkClass} href={`/boxscores?date=${nextDate}` as Route}>
            Next ({nextDate})
          </Link>
        )}
      </div>
      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass('left')}>Away</th>
              <th className={tableHeaderCellClass('right')}>PTS</th>
              <th className={tableHeaderCellClass('left')}>Home</th>
              <th className={tableHeaderCellClass('right')}>PTS</th>
              <th className={tableHeaderCellClass('left')}>Box Score</th>
            </tr>
          </thead>
          <tbody>
            {safeGames.map((game, gameIndex) => (
              <tr key={game.game_id} className={gameIndex % 2 === 0 ? 'bg-white' : 'bg-row-alt'}>
                <td className={tableCellClass('left')}>{game.away_abbrev}</td>
                <td className={tableCellClass('right')}>{game.away_score ?? '-'}</td>
                <td className={tableCellClass('left')}>{game.home_abbrev}</td>
                <td className={tableCellClass('right')}>{game.home_score ?? '-'}</td>
                <td className={tableCellClass('left')}>
                  <Link className={tableLinkClass} href={`/boxscores/${game.game_id}` as Route}>
                    {game.game_id}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
