import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPlayerSplitSeasons,
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
  searchParams: Promise<{
    season?: string;
  }>;
}

export default async function PlayerSplitsPage({
  params,
  searchParams,
}: PlayerSplitsPageProps): Promise<React.JSX.Element> {
  const { letter, id } = await params;
  const resolvedSearchParams = await searchParams;

  let playerId: string;
  try {
    playerId = validateBrefId(id);
  } catch {
    notFound();
  }

  const latestSeason = getPlayerLatestSeason(playerId);
  const availableSeasons = getPlayerSplitSeasons(playerId);
  const requestedSeason = resolvedSearchParams.season?.trim();
  const activeSeason =
    requestedSeason != null && availableSeasons.includes(requestedSeason)
      ? requestedSeason
      : latestSeason;

  const homeAway = getPlayerHomeAwaySplits(playerId, activeSeason);
  const monthly = getPlayerMonthlySplits(playerId, activeSeason);
  const opponents = getPlayerOpponentSplits(playerId, activeSeason);
  const divisions = getPlayerDivisionSplits(playerId, activeSeason);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link
          href={`/players/${letter}/${id}` as Route}
          className="mb-2 inline-block text-link transition-colors hover:brightness-110"
        >
          ← Back to Player
        </Link>
        <h1 className="inscription-title text-3xl">Player Splits</h1>
        {activeSeason != null && activeSeason.length > 0 && (
          <p className="mt-1 text-muted">Season: {activeSeason}</p>
        )}
      </div>

      {availableSeasons.length > 0 ? (
        <section className="mb-6 panel-paper p-4">
          <h2 className="mb-3 inscription-title text-lg">Season Selector</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {availableSeasons.map(seasonId => (
              <Link
                key={seasonId}
                href={
                  `/players/${letter}/${id}/splits${seasonId === latestSeason ? '' : `?season=${encodeURIComponent(seasonId)}`}` as Route
                }
                className={
                  seasonId === activeSeason
                    ? 'rounded-md bg-[color-mix(in_srgb,var(--dc-tertiary-container)_20%,var(--dc-surface-container-highest))] px-3 py-2 font-semibold text-heading shadow-input'
                    : 'rounded-md bg-[var(--dc-surface-container-highest)] px-3 py-2 outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] transition-all hover:bg-button-hover'
                }
              >
                {seasonId}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <SplitsTable title="Home vs Away" splits={homeAway} />
        <SplitsTable title="By Month" splits={monthly} />
        <SplitsTable title="By Opponent" splits={opponents} />
        <SplitsTable title="By Division" splits={divisions} />
      </div>
    </main>
  );
}
