/**
 * @fileoverview Referee detail page - career statistics for a single referee.
 *
 * Displays the referee's career game totals, crew chief vs. referee breakdown,
 * and a per-season game log.
 *
 * @module @/app/referees/[id]/page
 */

import type React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatsTable } from '@/components/stats-table';
import { getRefereePageData } from '@/lib/query';
import { routes } from '@/lib/routes';

interface RefereePageParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RefereePageParams): Promise<Metadata> {
  const { id } = await params;
  const data = getRefereePageData(id);
  if (data?.referee == null) return {};

  const name = String(data.referee['full_name'] ?? 'Referee');
  return {
    title: `${name} | NBA Reference`,
    description: `Career officiating statistics for NBA referee ${name}.`,
  };
}

export default async function RefereeDetailPage({
  params,
}: RefereePageParams): Promise<React.JSX.Element> {
  const { id } = await params;
  const data = getRefereePageData(id);

  if (data?.referee == null) notFound();

  const { referee, careerStats, seasonStats } = data;

  const name = String(referee['full_name'] ?? '');
  const startYear = referee['career_start_year'];
  const isActive = Number(referee['active']) === 1;
  const gamesTotal = Number(careerStats?.['games_total'] ?? 0);
  const gamesCrewChief = Number(careerStats?.['games_crew_chief'] ?? 0);
  const gamesReferee = Number(careerStats?.['games_referee'] ?? 0);
  const gamesAlternate = Number(careerStats?.['games_alternate'] ?? 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href={routes.referees()}>Referees</Link> / {name}
      </div>

      {/* Header */}
      <h1 className="mb-1 text-3xl font-bold" style={{ color: '#00245e' }}>
        {name}
      </h1>
      <p className="mb-4 text-sm text-muted-strong">
        {isActive ? 'Active Official' : 'Retired Official'}
        {startYear != null ? ` · Career since ${String(startYear)}` : ''}
      </p>

      {/* Career summary cards */}
      <section className="mb-8 surface-altar p-5">
        <h2 className="mb-4 inscription-title text-lg">Career Summary</h2>
        <div className="grid grid-cols-2 gap-4 text-center text-sm sm:grid-cols-4">
          <div>
            <div className="text-2xl font-bold tabular-nums">{gamesTotal}</div>
            <div className="text-muted">Total Games</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{gamesCrewChief}</div>
            <div className="text-muted">Crew Chief</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{gamesReferee}</div>
            <div className="text-muted">Referee</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{gamesAlternate}</div>
            <div className="text-muted">Alternate</div>
          </div>
        </div>
      </section>

      {/* Per-season breakdown */}
      {seasonStats.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-xl font-bold">Season-by-Season</h2>
          <StatsTable
            columns={[
              { key: 'season_id', label: 'Season', align: 'left' },
              { key: 'games_total', label: 'G', align: 'right' },
              { key: 'games_crew_chief', label: 'Crew Chief', align: 'right' },
              { key: 'games_referee', label: 'Referee', align: 'right' },
              { key: 'games_alternate', label: 'Alternate', align: 'right' },
            ]}
            rows={seasonStats}
            initialSort="season_id"
          />
        </section>
      )}

      {seasonStats.length === 0 && (
        <p className="text-sm text-muted">No season data available for this referee.</p>
      )}
    </main>
  );
}
