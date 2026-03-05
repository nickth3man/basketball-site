import type React from 'react';
import {
  getAllTimeLeadersByTotal,
  getLatestSeasonWithPlayerStats,
  getSeasonLeadersByPerGame,
} from '@/lib/queries';
import { StatsTable } from '@/components/stats-table';

export default function LeadersPage(): React.JSX.Element {
  const latestSeasonId = getLatestSeasonWithPlayerStats();

  if (latestSeasonId == null) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-3 text-2xl font-bold">Leaders</h1>
        <p className="text-sm text-muted-strong">No leader data available.</p>
      </main>
    );
  }

  const scoringLeaders = getSeasonLeadersByPerGame(latestSeasonId, 'pts', 25, 10);
  const reboundLeaders = getSeasonLeadersByPerGame(latestSeasonId, 'reb', 25, 10);
  const assistLeaders = getSeasonLeadersByPerGame(latestSeasonId, 'ast', 25, 10);

  const allTimePoints = getAllTimeLeadersByTotal('pts', 25, 100);
  const allTimeRebounds = getAllTimeLeadersByTotal('reb', 25, 100);
  const allTimeAssists = getAllTimeLeadersByTotal('ast', 25, 100);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold">Leaders</h1>
      <p className="mb-5 text-sm text-muted-strong">
        Season and all-time leaderboards built from the local stats database.
      </p>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{latestSeasonId} Per Game Leaders - Points</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'team', label: 'Tm' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'stat_per_game', label: 'PTS/G', align: 'right' },
            { key: 'stat_total', label: 'PTS', align: 'right' },
          ]}
          rows={scoringLeaders}
          initialSort="stat_per_game"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{latestSeasonId} Per Game Leaders - Rebounds</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'team', label: 'Tm' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'stat_per_game', label: 'REB/G', align: 'right' },
            { key: 'stat_total', label: 'REB', align: 'right' },
          ]}
          rows={reboundLeaders}
          initialSort="stat_per_game"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{latestSeasonId} Per Game Leaders - Assists</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'team', label: 'Tm' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'stat_per_game', label: 'AST/G', align: 'right' },
            { key: 'stat_total', label: 'AST', align: 'right' },
          ]}
          rows={assistLeaders}
          initialSort="stat_per_game"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">All-Time Leaders - Points</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'stat_total', label: 'PTS', align: 'right' },
            { key: 'stat_per_game', label: 'PTS/G', align: 'right' },
          ]}
          rows={allTimePoints}
          initialSort="stat_total"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">All-Time Leaders - Rebounds</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'stat_total', label: 'REB', align: 'right' },
            { key: 'stat_per_game', label: 'REB/G', align: 'right' },
          ]}
          rows={allTimeRebounds}
          initialSort="stat_total"
        />
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">All-Time Leaders - Assists</h2>
        <StatsTable
          columns={[
            { key: 'full_name', label: 'Player' },
            { key: 'g', label: 'G', align: 'right' },
            { key: 'stat_total', label: 'AST', align: 'right' },
            { key: 'stat_per_game', label: 'AST/G', align: 'right' },
          ]}
          rows={allTimeAssists}
          initialSort="stat_total"
        />
      </section>
    </main>
  );
}
