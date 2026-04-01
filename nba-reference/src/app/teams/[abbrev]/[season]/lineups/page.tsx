import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatsTable } from '@/components/stats-table';
import { getTeamByAbbrev, getTeamLineups } from '@/lib/queries';
import { parseSeasonTokenToSeasonId } from '@/lib/season-utils';
import { validateTeamAbbrev } from '@/lib/validation';

export default async function LineupsPage({
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

  const lineups = getTeamLineups(team.team_id, seasonId);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/teams">Teams</Link> /{' '}
        <Link href={`/teams/${team.abbreviation}`}>{team.abbreviation}</Link> /{' '}
        <Link href={`/teams/${team.abbreviation}/${season}` as Route}>{seasonId}</Link> / Lineups
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="inscription-title text-3xl">
          {seasonId} {team.full_name} — Lineups
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
          Top 5-player lineup units sorted by net rating. Lineup data is aggregated from
          play-by-play tracking and refreshed each day by the ETL pipeline.
        </p>
      </section>

      {lineups.length === 0 ? (
        <section className="surface-pedestal p-8 text-center">
          <p className="text-base text-muted">
            Lineup data is not yet available for this team season.
          </p>
          <p className="mt-2 text-sm text-muted">
            The ETL pipeline must be updated to aggregate 5-player lineup units from play-by-play
            substitution events before this page will show data.
          </p>
        </section>
      ) : (
        <section>
          <StatsTable
            columns={[
              { key: 'player_ids', label: 'Lineup (Player IDs)' },
              { key: 'minutes', label: 'MIN', align: 'right' },
              { key: 'possessions', label: 'POSS', align: 'right' },
              { key: 'net_rating', label: 'Net Rtg', align: 'right' },
              { key: 'off_rating', label: 'Off Rtg', align: 'right' },
              { key: 'def_rating', label: 'Def Rtg', align: 'right' },
              { key: 'points_scored', label: 'PTS Scored', align: 'right' },
              { key: 'points_allowed', label: 'PTS Allowed', align: 'right' },
            ]}
            rows={lineups}
            initialSort="net_rating"
          />
        </section>
      )}
    </main>
  );
}
