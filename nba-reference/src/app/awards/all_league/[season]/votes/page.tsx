import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatsTable } from '@/components/stats-table';
import { parseSeasonTokenToSeasonId } from '@/lib/season-utils';
import { getAllNBAVotingBySeason } from '@/lib/queries';

export default async function AllLeagueVotesPage({
  params,
}: {
  params: Promise<{ season: string }>;
}): Promise<React.JSX.Element> {
  const { season } = await params;
  const seasonId = parseSeasonTokenToSeasonId(season);
  if (seasonId == null) notFound();

  const votes = getAllNBAVotingBySeason(seasonId);
  if (votes.length === 0) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/awards">Awards</Link> /{' '}
        <Link href={'/awards/all_league' as Route}>All-NBA</Link> / {seasonId} Votes
      </div>

      <h1 className="mb-2 text-3xl font-bold">All-NBA Voting - {seasonId}</h1>
      <p className="mb-4 text-sm text-muted-strong">
        NBA-only voting results for All-NBA selections.
      </p>

      <StatsTable
        columns={[
          { key: 'full_name', label: 'Player' },
          { key: 'team_abbrev', label: 'Tm' },
          { key: 'team_number', label: 'Team #', align: 'right' },
          { key: 'position', label: 'Pos' },
          { key: 'pts_won', label: 'PTS Won', align: 'right' },
          { key: 'pts_max', label: 'PTS Max', align: 'right' },
          { key: 'share', label: 'Share', align: 'right' },
          { key: 'first_team_votes', label: '1st', align: 'right' },
          { key: 'second_team_votes', label: '2nd', align: 'right' },
          { key: 'third_team_votes', label: '3rd', align: 'right' },
        ]}
        rows={votes}
        initialSort="pts_won"
      />
    </main>
  );
}
