import type { JSX } from 'react';
import { Suspense } from 'react';
import { ComparisonTable, PlayerSelector, RadarComparison } from '@/components/compare';
import type { RadarDataPoint } from '@/components/compare';
import { getPlayerComparisonData, type PlayerCareerStats } from '@/lib/queries/compare';

interface ComparePageProps {
  searchParams: Promise<{
    p1?: string;
    p2?: string;
  }>;
}

function buildRadarData(stats1: PlayerCareerStats, stats2: PlayerCareerStats): RadarDataPoint[] {
  const maxValues = {
    ppg: 35,
    rpg: 15,
    apg: 12,
    spg: 2.5,
    bpg: 3.5,
    fg_pct: 0.7,
    fg3_pct: 0.5,
    ft_pct: 0.95,
    per: 35,
    ws: 15,
  };

  return [
    {
      stat: 'Scoring',
      player1: Math.min(100, (stats1.ppg / maxValues.ppg) * 100),
      player2: Math.min(100, (stats2.ppg / maxValues.ppg) * 100),
    },
    {
      stat: 'Rebounding',
      player1: Math.min(100, (stats1.rpg / maxValues.rpg) * 100),
      player2: Math.min(100, (stats2.rpg / maxValues.rpg) * 100),
    },
    {
      stat: 'Assists',
      player1: Math.min(100, (stats1.apg / maxValues.apg) * 100),
      player2: Math.min(100, (stats2.apg / maxValues.apg) * 100),
    },
    {
      stat: 'Steals',
      player1: Math.min(100, (stats1.spg / maxValues.spg) * 100),
      player2: Math.min(100, (stats2.spg / maxValues.spg) * 100),
    },
    {
      stat: 'Blocks',
      player1: Math.min(100, (stats1.bpg / maxValues.bpg) * 100),
      player2: Math.min(100, (stats2.bpg / maxValues.bpg) * 100),
    },
    {
      stat: 'FG%',
      player1: Math.min(100, (stats1.fg_pct / maxValues.fg_pct) * 100),
      player2: Math.min(100, (stats2.fg_pct / maxValues.fg_pct) * 100),
    },
    {
      stat: '3P%',
      player1: Math.min(100, (stats1.fg3_pct / maxValues.fg3_pct) * 100),
      player2: Math.min(100, (stats2.fg3_pct / maxValues.fg3_pct) * 100),
    },
    {
      stat: 'PER',
      player1: Math.min(100, (stats1.per != null ? stats1.per / maxValues.per : 0) * 100),
      player2: Math.min(100, (stats2.per != null ? stats2.per / maxValues.per : 0) * 100),
    },
  ];
}

interface PlayerSelectorWrapperProps {
  slot: 'p1' | 'p2';
  playerId: string | undefined;
  playerName: string | undefined;
  otherPlayerId: string | undefined;
}

function PlayerSelectorWrapper({
  slot,
  playerId,
  playerName,
  otherPlayerId,
}: PlayerSelectorWrapperProps): JSX.Element {
  const props =
    playerId != null && playerName != null
      ? {
          slot,
          selectedPlayer: { id: playerId, name: playerName } as const,
          otherPlayerId,
        }
      : { slot, otherPlayerId };

  return <PlayerSelector {...props} />;
}

export default async function ComparePage({
  searchParams,
}: ComparePageProps): Promise<JSX.Element> {
  const { p1, p2 } = await searchParams;

  const player1Data = p1 != null ? getPlayerComparisonData(p1) : undefined;
  const player2Data = p2 != null ? getPlayerComparisonData(p2) : undefined;

  const showComparison = player1Data !== undefined && player2Data !== undefined;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">Player Comparison</h1>
      <p className="mb-6 text-sm text-muted">
        Compare career statistics between two NBA players side-by-side.
      </p>

      <section className="mb-6 panel-paper p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Suspense fallback={<div className="h-[42px] animate-pulse rounded bg-paper-soft" />}>
            <PlayerSelectorWrapper
              slot="p1"
              playerId={p1}
              playerName={player1Data?.info.full_name}
              otherPlayerId={p2}
            />
          </Suspense>
          <Suspense fallback={<div className="h-[42px] animate-pulse rounded bg-paper-soft" />}>
            <PlayerSelectorWrapper
              slot="p2"
              playerId={p2}
              playerName={player2Data?.info.full_name}
              otherPlayerId={p1}
            />
          </Suspense>
        </div>
      </section>

      {p1 != null && player1Data === undefined ? (
        <section className="mb-6 panel-paper p-4 text-sm text-muted-strong">
          Player &quot;{p1}&quot; not found or has insufficient career data.
        </section>
      ) : null}

      {p2 != null && player2Data === undefined ? (
        <section className="mb-6 panel-paper p-4 text-sm text-muted-strong">
          Player &quot;{p2}&quot; not found or has insufficient career data.
        </section>
      ) : null}

      {!showComparison ? (
        <section className="panel-paper p-4 text-sm text-muted-strong">
          Select two players above to see their career statistics compared side-by-side with a radar
          chart and detailed breakdown.
        </section>
      ) : null}

      {showComparison ? (
        <div className="space-y-6">
          <section className="panel-paper p-4">
            <h2 className="mb-4 text-xl font-bold text-heading">
              {player1Data.info.full_name} vs {player2Data.info.full_name}
            </h2>
            <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted">
              <span>
                <strong className="text-heading">{player1Data.info.full_name}</strong>
                {player1Data.info.position != null ? ` · ${player1Data.info.position}` : ''}
                {player1Data.info.height != null ? ` · ${player1Data.info.height}` : ''}
                {player1Data.info.weight != null ? ` · ${player1Data.info.weight} lb` : ''}
              </span>
              <span>
                <strong className="text-heading">{player2Data.info.full_name}</strong>
                {player2Data.info.position != null ? ` · ${player2Data.info.position}` : ''}
                {player2Data.info.height != null ? ` · ${player2Data.info.height}` : ''}
                {player2Data.info.weight != null ? ` · ${player2Data.info.weight} lb` : ''}
              </span>
            </div>
          </section>

          <section className="panel-paper p-4">
            <h3 className="mb-4 text-lg font-semibold text-heading">Statistical Profile</h3>
            <RadarComparison
              data={buildRadarData(player1Data.stats, player2Data.stats)}
              player1Name={player1Data.info.full_name}
              player2Name={player2Data.info.full_name}
            />
          </section>

          <section className="panel-paper p-4">
            <h3 className="mb-4 text-lg font-semibold text-heading">Career Averages Comparison</h3>
            <ComparisonTable
              player1Name={player1Data.info.full_name}
              player2Name={player2Data.info.full_name}
              player1Stats={player1Data.stats}
              player2Stats={player2Data.stats}
            />
            <p className="mt-4 text-xs text-muted">
              Career averages include only NBA seasons with 20+ games played.
            </p>
          </section>
        </div>
      ) : null}
    </main>
  );
}
