import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatsTable } from '@/components/stats-table';
import { formatUsd } from '@/lib/formatters';
import { endYearToSeasonId } from '@/lib/season-utils';
import { getTeamByAbbrev, getTeamSalarySeasons, getTeamSalariesBySeason } from '@/lib/queries';
import { validateTeamAbbrev } from '@/lib/validation';

export default async function TeamSalariesPage({
  params,
  searchParams,
}: {
  params: Promise<{ abbrev: string }>;
  searchParams: Promise<{ season?: string }>;
}): Promise<React.JSX.Element> {
  const { abbrev } = await params;
  const { season } = await searchParams;

  const normalizedAbbrev = validateTeamAbbrev(abbrev.toUpperCase());
  const team = getTeamByAbbrev(normalizedAbbrev);
  if (team == null) notFound();

  const availableSeasons = getTeamSalarySeasons(team.abbreviation);
  if (availableSeasons.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-2 text-3xl font-bold">{team.full_name} Salaries</h1>
        <p className="text-sm text-muted-strong">No NBA salary data available for this team.</p>
      </main>
    );
  }

  const requestedSeasonId =
    season == null
      ? null
      : /^\d{4}-\d{2}$/.test(season)
        ? season
        : /^\d{4}$/.test(season)
          ? endYearToSeasonId(Number(season))
          : null;

  const seasonId =
    requestedSeasonId != null && availableSeasons.includes(requestedSeasonId)
      ? requestedSeasonId
      : availableSeasons[0];

  if (seasonId == null) notFound();

  const salaries = getTeamSalariesBySeason(team.abbreviation, seasonId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/teams">Teams</Link> /{' '}
        <Link href={`/teams/${team.abbreviation}` as Route}>{team.abbreviation}</Link> / Salaries
      </div>

      <h1 className="mb-2 text-3xl font-bold">{team.full_name} Salaries</h1>
      <p className="mb-4 text-sm text-muted-strong">NBA-only salary records by season.</p>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {availableSeasons.map(s => (
          <Link
            key={s}
            href={`/teams/${team.abbreviation}/salaries?season=${encodeURIComponent(s)}` as Route}
            className={
              s === seasonId
                ? 'rounded border border-line bg-button-bg px-2 py-1 font-semibold'
                : 'rounded border border-line px-2 py-1 hover:bg-button-bg'
            }
          >
            {s}
          </Link>
        ))}
      </div>

      <StatsTable
        columns={[
          { key: 'season_id', label: 'Season' },
          { key: 'team_abbrev', label: 'Team' },
          { key: 'full_name', label: 'Player' },
          { key: 'salary_fmt', label: 'Salary', align: 'right' },
        ]}
        rows={salaries.map(row => ({ ...row, salary_fmt: formatUsd(row.salary) }))}
        initialSort="salary"
      />
    </main>
  );
}
