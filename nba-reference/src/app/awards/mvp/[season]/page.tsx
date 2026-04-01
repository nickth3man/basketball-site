import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatsTable } from '@/components/stats-table';
import { parseSeasonTokenToSeasonId } from '@/lib/season-utils';
import { getMVPVotingBySeason } from '@/lib/queries';

export default async function MVPVotesPage({
  params,
}: {
  params: Promise<{ season: string }>;
}): Promise<React.JSX.Element> {
  const { season } = await params;
  const seasonId = parseSeasonTokenToSeasonId(season);
  if (seasonId == null) notFound();

  const votes = getMVPVotingBySeason(seasonId);
  if (votes.length === 0) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/awards">Awards</Link> /{' '}
        <Link href={'/awards/mvp' as Route}>MVP</Link> / {seasonId} Voting
      </div>

      <h1 className="mb-2 text-3xl font-bold">MVP Voting - {seasonId}</h1>
      <p className="mb-4 text-sm text-muted-strong">
        Full voting breakdown for the NBA Most Valuable Player Award.
      </p>

      <StatsTable
        columns={[
          { key: 'rank', label: 'Rk', align: 'right' },
          { key: 'full_name', label: 'Player' },
          { key: 'team_abbrev', label: 'Tm' },
          { key: 'votes_received', label: 'Pts Won', align: 'right' },
          { key: 'votes_possible', label: 'Pts Max', align: 'right' },
          { key: 'vote_share', label: 'Share', align: 'right' },
        ]}
        rows={votes}
        initialSort="votes_received"
      />
    </main>
  );
}
