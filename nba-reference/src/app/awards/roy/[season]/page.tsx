import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatsTable } from '@/components/stats-table';
import { parseSeasonTokenToSeasonId } from '@/lib/season-utils';
import { getROYVotingBySeason } from '@/lib/queries/awards';

export default async function ROYVotesPage({
  params,
}: {
  params: Promise<{ season: string }>;
}): Promise<React.JSX.Element> {
  const { season } = await params;
  const seasonId = parseSeasonTokenToSeasonId(season);
  if (seasonId == null) notFound();

  const votes = getROYVotingBySeason(seasonId);
  if (votes.length === 0) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/awards">Awards</Link> /{' '}
        <Link href={'/awards/roy' as Route}>ROY</Link> / {seasonId} Voting
      </div>

      <h1 className="mb-2 text-3xl font-bold">NBA ROY Voting - {seasonId}</h1>
      <p className="mb-4 text-sm text-muted-strong">
        Full voting breakdown for the Rookie of the Year award.
      </p>

      <StatsTable
        columns={[
          { key: 'rank', label: 'Rank', align: 'right' },
          { key: 'full_name', label: 'Player' },
          { key: 'team_abbrev', label: 'Tm' },
          { key: 'votes_received', label: 'PTS Won', align: 'right' },
          { key: 'vote_percentage', label: 'Share', align: 'right' },
          { key: 'first_place_votes', label: '1st', align: 'right' },
          { key: 'second_place_votes', label: '2nd', align: 'right' },
          { key: 'third_place_votes', label: '3rd', align: 'right' },
        ]}
        rows={votes}
        initialSort="votes_received"
      />
    </main>
  );
}
