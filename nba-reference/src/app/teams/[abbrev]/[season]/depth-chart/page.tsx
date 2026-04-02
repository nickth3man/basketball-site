import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatsTable } from '@/components/stats-table';
import { DepthChart } from '@/components/charts/depth-chart';
import type { DepthChartRow } from '@/components/charts/depth-chart';
import { getTeamByAbbrev, getTeamDepthChart } from '@/lib/queries';
import { parseSeasonTokenToSeasonId } from '@/lib/season-utils';
import { validateTeamAbbrev } from '@/lib/validation';

export default async function DepthChartPage({
  params,
}: {
  params: Promise<{ abbrev: string; season: string }>;
}): Promise<React.JSX.Element> {
  const { abbrev, season } = await params;
  const normalizedAbbrev = validateTeamAbbrev(abbrev.toUpperCase());
  const seasonId = parseSeasonTokenToSeasonId(season);
  if (seasonId == null) notFound();

  const team = getTeamByAbbrev(normalizedAbbrev);
  if (team == null) notFound();

  const players = getTeamDepthChart(team.team_id, seasonId);

  // Map raw DB rows to typed DepthChartRow
  const chartRows: DepthChartRow[] = players.map(row => ({
    full_name: String(row['full_name'] ?? ''),
    bref_id: String(row['bref_id'] ?? ''),
    pos: row['pos'] != null ? String(row['pos']) : null,
    mp: row['mp'] != null ? Number(row['mp']) : null,
    mpg: row['mpg'] != null ? Number(row['mpg']) : null,
    g: row['g'] != null ? Number(row['g']) : null,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/teams">Teams</Link> /{' '}
        <Link href={`/teams/${team.abbreviation}`}>{team.abbreviation}</Link> /{' '}
        <Link href={`/teams/${team.abbreviation}/${season}` as Route}>{seasonId}</Link> / Depth
        Chart
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="inscription-title text-3xl">
          {seasonId} {team.full_name} — Depth Chart
        </h1>
        <Link
          href={`/teams/${team.abbreviation}/${season}` as Route}
          className="rounded-md bg-[var(--dc-surface-container-highest)] px-2 py-1 text-xs outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] transition-all hover:bg-button-hover"
        >
          ← Team Overview
        </Link>
      </div>

      <section className="mb-6 surface-altar p-5">
        <p className="text-sm text-muted-strong">
          Minutes distribution by player and position for the <strong>{seasonId}</strong> season.
          Bars are colour-coded by position — <span style={{ color: '#00245e' }}>■</span> PG,{' '}
          <span style={{ color: '#1a4a8a' }}>■</span> SG,{' '}
          <span style={{ color: '#9f402d' }}>■</span> SF,{' '}
          <span style={{ color: '#c4603e' }}>■</span> PF,{' '}
          <span style={{ color: '#735c00' }}>■</span> C.
        </p>
      </section>

      {players.length === 0 ? (
        <section className="surface-pedestal p-8 text-center">
          <p className="text-base text-muted">
            No depth chart data available for this team season.
          </p>
        </section>
      ) : (
        <>
          <section className="mb-8 surface-pedestal p-4">
            <h2 className="mb-4 inscription-title text-xl">Minutes Distribution</h2>
            <DepthChart players={chartRows} height={Math.max(320, chartRows.length * 22)} />
          </section>

          <section>
            <h2 className="mb-3 inscription-title text-xl">Minutes by Player</h2>
            <StatsTable
              columns={[
                {
                  key: 'full_name',
                  label: 'Player',
                  link: { type: 'player', valueKey: 'bref_id' },
                },
                { key: 'pos', label: 'Pos' },
                { key: 'g', label: 'G', align: 'right' },
                { key: 'mp', label: 'Total MIN', align: 'right' },
                { key: 'mpg', label: 'MIN/G', align: 'right' },
              ]}
              rows={players}
              initialSort="mp"
            />
          </section>
        </>
      )}
    </main>
  );
}
