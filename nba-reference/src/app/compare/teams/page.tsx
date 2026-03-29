import type { JSX } from 'react';
import Link from 'next/link';
import { StatsTable } from '@/components/stats-table';
import { getTeamInfo, getTeamCurrentStats } from '@/lib/queries/compare';

interface TeamComparePageProps {
  searchParams: Promise<{ t1?: string; t2?: string }>;
}

export default async function TeamComparePage({ searchParams }: TeamComparePageProps): Promise<JSX.Element> {
  const { t1, t2 } = await searchParams;

  const team1Info = t1 != null ? getTeamInfo(t1.toUpperCase()) : undefined;
  const team2Info = t2 != null ? getTeamInfo(t2.toUpperCase()) : undefined;
  const team1Stats = t1 != null ? getTeamCurrentStats(t1.toUpperCase()) : undefined;
  const team2Stats = t2 != null ? getTeamCurrentStats(t2.toUpperCase()) : undefined;

  const showComparison = team1Info != null && team2Info != null && team1Stats != null && team2Stats != null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">Team Comparison</h1>
      <p className="mb-6 text-sm text-muted">
        Compare current season statistics between two NBA teams.
      </p>

      <section className="mb-6 panel-paper p-4">
        <div className="mb-4 flex gap-4">
          <Link
            href="/compare"
            className="rounded-md bg-[var(--dc-surface-container-highest)] px-3 py-1.5 text-xs outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] transition-all hover:bg-button-hover"
          >
            Player Compare
          </Link>
          <span className="rounded-md bg-[color-mix(in_srgb,var(--dc-tertiary-container)_20%,var(--dc-surface-container-highest))] px-3 py-1.5 text-xs font-semibold text-heading shadow-input">
            Team Compare
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted" htmlFor="team1">Team 1 Abbreviation</label>
            <input
              id="team1"
              type="text"
              placeholder="LAL"
              defaultValue={t1 ?? ''}
              className="w-full rounded-md bg-[var(--dc-surface-container-highest)] px-3 py-2 text-sm outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted" htmlFor="team2">Team 2 Abbreviation</label>
            <input
              id="team2"
              type="text"
              placeholder="BOS"
              defaultValue={t2 ?? ''}
              className="w-full rounded-md bg-[var(--dc-surface-container-highest)] px-3 py-2 text-sm outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)]"
            />
          </div>
        </div>
      </section>

      {t1 != null && team1Info == null ? (
        <section className="mb-6 panel-paper p-4 text-sm text-muted-strong">
          Team &quot;{t1}&quot; not found.
        </section>
      ) : null}

      {t2 != null && team2Info == null ? (
        <section className="mb-6 panel-paper p-4 text-sm text-muted-strong">
          Team &quot;{t2}&quot; not found.
        </section>
      ) : null}

      {!showComparison ? (
        <section className="panel-paper p-4 text-sm text-muted-strong">
          Enter two team abbreviations above to compare their current season statistics.
        </section>
      ) : null}

      {showComparison ? (
        <div className="space-y-6">
          <section className="panel-paper p-4">
            <h2 className="mb-4 text-xl font-bold text-heading">
              {team1Info.full_name} vs {team2Info.full_name}
            </h2>
            <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted">
              <span>
                <strong className="text-heading">{team1Info.full_name}</strong>
                {team1Info.conference != null ? ` · ${team1Info.conference}` : ''}
                {team1Info.division != null ? ` · ${team1Info.division}` : ''}
              </span>
              <span>
                <strong className="text-heading">{team2Info.full_name}</strong>
                {team2Info.conference != null ? ` · ${team2Info.conference}` : ''}
                {team2Info.division != null ? ` · ${team2Info.division}` : ''}
              </span>
            </div>
          </section>

          <section className="panel-paper p-4">
            <h3 className="mb-4 text-lg font-semibold text-heading">Current Season Stats</h3>
            <StatsTable
              columns={[
                { key: 'stat', label: 'Stat' },
                { key: 'team1', label: team1Info.abbreviation, align: 'right' },
                { key: 'team2', label: team2Info.abbreviation, align: 'right' },
              ]}
              rows={[
                { stat: 'Record', team1: `${team1Stats.wins ?? '-'}-${team1Stats.losses ?? '-'}`, team2: `${team2Stats.wins ?? '-'}-${team2Stats.losses ?? '-'}` },
                { stat: 'Offensive Rating', team1: team1Stats.o_rtg ?? '-', team2: team2Stats.o_rtg ?? '-' },
                { stat: 'Defensive Rating', team1: team1Stats.d_rtg ?? '-', team2: team2Stats.d_rtg ?? '-' },
                { stat: 'Net Rating', team1: team1Stats.n_rtg ?? '-', team2: team2Stats.n_rtg ?? '-' },
                { stat: 'Pace', team1: team1Stats.pace ?? '-', team2: team2Stats.pace ?? '-' },
                { stat: 'True Shooting %', team1: team1Stats.ts_pct ?? '-', team2: team2Stats.ts_pct ?? '-' },
                { stat: 'Effective FG%', team1: team1Stats.e_fg_pct ?? '-', team2: team2Stats.e_fg_pct ?? '-' },
              ]}
              initialSort="stat"
            />
          </section>
        </div>
      ) : null}
    </main>
  );
}
