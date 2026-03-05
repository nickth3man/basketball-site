import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPlayerHomeAwaySplits,
  getPlayerMonthlySplits,
  getPlayerOpponentSplits,
  getPlayerDivisionSplits,
  getPlayerLatestSeason,
} from '@/lib/queries/player-splits';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
} from '@/lib/table-styles';
import { validateBrefId } from '@/lib/validation';

interface SplitsTableProps {
  title: string;
  splits: Array<{
    split_value: string;
    g: number;
    mp: number;
    pts: number;
    reb: number;
    ast: number;
    fg: number;
    fga: number;
    x3p: number;
    x3pa: number;
    ft: number;
    fta: number;
  }>;
}

function SplitsTable({ title, splits }: SplitsTableProps): React.JSX.Element {
  const formatPct = (made: number, attempted: number): string => {
    if (attempted === 0) return '-';
    return `${((made / attempted) * 100).toFixed(1)}%`;
  };

  return (
    <section className="panel-paper p-4">
      <h2 className="mb-3 text-lg font-bold text-heading">{title}</h2>
      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass('left')}>Split</th>
              <th className={tableHeaderCellClass('right')}>G</th>
              <th className={tableHeaderCellClass('right')}>MP</th>
              <th className={tableHeaderCellClass('right')}>PTS</th>
              <th className={tableHeaderCellClass('right')}>REB</th>
              <th className={tableHeaderCellClass('right')}>AST</th>
              <th className={tableHeaderCellClass('right')}>FG%</th>
              <th className={tableHeaderCellClass('right')}>3P%</th>
              <th className={tableHeaderCellClass('right')}>FT%</th>
            </tr>
          </thead>
          <tbody>
            {splits.map((split, index) => (
              <tr
                key={split.split_value}
                className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
              >
                <td className={tableCellClass('left')}>{split.split_value}</td>
                <td className={tableCellClass('right')}>{split.g}</td>
                <td className={tableCellClass('right')}>{Math.round(split.mp / split.g)}</td>
                <td className={tableCellClass('right')}>{(split.pts / split.g).toFixed(1)}</td>
                <td className={tableCellClass('right')}>{(split.reb / split.g).toFixed(1)}</td>
                <td className={tableCellClass('right')}>{(split.ast / split.g).toFixed(1)}</td>
                <td className={tableCellClass('right')}>{formatPct(split.fg, split.fga)}</td>
                <td className={tableCellClass('right')}>{formatPct(split.x3p, split.x3pa)}</td>
                <td className={tableCellClass('right')}>{formatPct(split.ft, split.fta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface PlayerSplitsPageProps {
  params: Promise<{
    letter: string;
    id: string;
  }>;
}

export default async function PlayerSplitsPage({
  params,
}: PlayerSplitsPageProps): Promise<React.JSX.Element> {
  const { letter, id } = await params;

  let playerId: string;
  try {
    playerId = validateBrefId(id);
  } catch {
    notFound();
  }

  const latestSeason = getPlayerLatestSeason(playerId);

  const homeAway = getPlayerHomeAwaySplits(playerId, latestSeason);
  const monthly = getPlayerMonthlySplits(playerId, latestSeason);
  const opponents = getPlayerOpponentSplits(playerId, latestSeason).slice(0, 10);
  const divisions = getPlayerDivisionSplits(playerId, latestSeason);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link
          href={`/players/${letter}/${id}` as Route}
          className="mb-2 inline-block text-link hover:underline"
        >
          ← Back to Player
        </Link>
        <h1 className="text-3xl font-bold text-heading">Player Splits</h1>
        {latestSeason != null && latestSeason.length > 0 && (
          <p className="mt-1 text-muted">Season: {latestSeason}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SplitsTable title="Home vs Away" splits={homeAway} />
        <SplitsTable title="By Month" splits={monthly} />
        <SplitsTable title="By Opponent (Top 10)" splits={opponents} />
        <SplitsTable title="By Division" splits={divisions} />
      </div>
    </main>
  );
}
