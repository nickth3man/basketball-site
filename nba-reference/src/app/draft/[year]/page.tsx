import type React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatsTable } from '@/components/stats-table';
import { getDraftBySeason } from '@/lib/queries';
import { parseSeasonTokenToSeasonId } from '@/lib/season-utils';

export default async function DraftYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<React.JSX.Element> {
  const { year } = await params;
  const seasonId = parseSeasonTokenToSeasonId(year);
  if (seasonId == null) notFound();

  const picks = getDraftBySeason(seasonId);
  if (picks.length === 0) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/draft">Draft</Link> / {seasonId}
      </div>
      <h1 className="mb-3 text-3xl font-bold">{seasonId} NBA Draft</h1>

      <StatsTable
        columns={[
          { key: 'overall_pick', label: 'Pick', align: 'right' },
          { key: 'draft_round', label: 'Round', align: 'right' },
          { key: 'bref_team_abbrev', label: 'Team' },
          { key: 'player_name', label: 'Player' },
          { key: 'college', label: 'College' },
          { key: 'lg', label: 'League' },
          { key: 'bref_player_id', label: 'BRef ID' },
        ]}
        rows={picks}
        initialSort="overall_pick"
      />
    </main>
  );
}
