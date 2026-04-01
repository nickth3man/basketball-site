import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatsTable } from '@/components/stats-table';
import { getTeamByAbbrev, getTeamOnOff } from '@/lib/queries';
import { parseSeasonTokenToSeasonId } from '@/lib/season-utils';
import { validateTeamAbbrev } from '@/lib/validation';

export default async function OnOffPage({
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

  const onOff = getTeamOnOff(team.team_id, seasonId);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/teams">Teams</Link> /{' '}
        <Link href={`/teams/${team.abbreviation}`}>{team.abbreviation}</Link> /{' '}
        <Link href={`/teams/${team.abbreviation}/${season}` as Route}>{seasonId}</Link> / On-Off
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="inscription-title text-3xl">
          {seasonId} {team.full_name} — On/Off Analysis
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
          Per-player net rating impact when on vs. off the court. Net Impact is the difference
          between on-court and off-court net ratings — a positive value means the team performs
          better with that player on the floor.
        </p>
        <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-3">
          <div>
            <span className="font-semibold">On Rtg</span> — team net rating per 100 poss. with
            player on court
          </div>
          <div>
            <span className="font-semibold">Off Rtg</span> — team net rating per 100 poss. with
            player on bench
          </div>
          <div>
            <span className="font-semibold">Net Impact</span> — On Rtg minus Off Rtg
          </div>
        </div>
      </section>

      {onOff.length === 0 ? (
        <section className="surface-pedestal p-8 text-center">
          <p className="text-base text-muted">No on/off data available for this team season.</p>
        </section>
      ) : (
        <section>
          <StatsTable
            columns={[
              { key: 'full_name', label: 'Player', link: { type: 'player', valueKey: 'bref_id' } },
              { key: 'mp', label: 'MIN', align: 'right' },
              { key: 'on_net_rating', label: 'On Rtg', align: 'right' },
              { key: 'off_net_rating', label: 'Off Rtg', align: 'right' },
              { key: 'net_impact', label: 'Net Impact', align: 'right' },
            ]}
            rows={onOff}
            initialSort="net_impact"
          />
        </section>
      )}
    </main>
  );
}
