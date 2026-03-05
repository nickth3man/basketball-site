import type React from 'react';
import { notFound } from 'next/navigation';
import SeasonPage from '@/app/seasons/[year]/page';
import { parseSeasonTokenToSeasonId } from '@/lib/season-utils';

export default async function LeagueSeasonPage({
  params,
}: {
  params: Promise<{ leagueSeason: string }>;
}): Promise<React.JSX.Element> {
  const { leagueSeason } = await params;
  const seasonId = parseSeasonTokenToSeasonId(leagueSeason);
  if (seasonId == null) notFound();

  return SeasonPage({ params: Promise.resolve({ year: seasonId }) });
}
