/**
 * @fileoverview Player detail page - comprehensive player statistics dashboard.
 *
 * This page displays 14+ data sections using extracted sub-components:
 * - Player bio (photo, position, birth info, draft, career summary)
 * - Awards and honors badges
 * - Per-game, per-36, per-100 possession stats
 * - Season totals and advanced metrics
 * - Shooting breakdowns and adjusted shooting
 * - Play-by-play derived stats
 * - Full game log
 * - Awards history
 * - Salary history
 * - Career game highs
 *
 * Data is fetched server-side in parallel for optimal performance.
 * Uses sticky navigation sidebar for section jumping.
 *
 * @module @/app/players/[letter]/[id]/page
 */

import type React from 'react';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CareerTrajectoryChart } from '@/components/charts';
import { RelatedLinksPanel } from '@/components/related-links-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsTable } from '@/components/stats-table';
import { StructuredData } from '@/components/structured-data';
import { formatUsd } from '@/lib/formatters';
import { getPlayerPageData } from '@/lib/query';
import { getSiteUrl } from '@/lib/site-config';
import { validateBrefId } from '@/lib/validation';
import {
  ADJUSTED_SHOOTING_COLUMNS,
  ADVANCED_COLUMNS,
  AWARDS_COLUMNS,
  buildCareerData,
  buildPlayerRelatedLinks,
  GAME_LOG_COLUMNS,
  PBP_COLUMNS,
  PER_100_COLUMNS,
  PER_36_COLUMNS,
  PER_GAME_COLUMNS,
  PLAYER_PAGE_ANCHOR_SECTIONS,
  SALARY_COLUMNS,
  SHOOTING_COLUMNS,
  TOTALS_COLUMNS,
} from './player-page-config';
import { AwardsBadges, GameHighs, PlayerBioHeader } from './components';

interface PlayerPageParams {
  letter: string;
  id: string;
}

interface PlayerPageProps {
  params: Promise<PlayerPageParams>;
}

/**
 * Validates URL letter matches player ID first letter (BBR-style canonical URL).
 */
function validateLetterMatch(letter: string, id: string): boolean {
  return /^[a-z]$/i.test(letter) && id.slice(0, 1).toLowerCase() === letter.toLowerCase();
}

/**
 * Generate metadata for the player detail page.
 */
export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { letter, id } = await params;
  if (!validateLetterMatch(letter, id)) return {};
  try {
    validateBrefId(id);
  } catch {
    return {};
  }

  const playerPageData = getPlayerPageData(id);
  const player = playerPageData?.player;
  if (player == null) return {};

  const siteUrl = getSiteUrl();
  const title = `${player.full_name} Stats | NBA Reference`;
  const description = `Complete career statistics for ${player.full_name}${player.position != null ? ` (${player.position})` : ''}. View per-game, advanced, shooting, and salary data.`;
  const url = `${siteUrl}/players/${letter}/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

/**
 * Build JSON-LD Person schema for a player.
 */
function getPlayerJsonLd(
  letter: string,
  id: string,
  player: { full_name: string; position: string | null; is_active: number | null },
  summary: Record<string, number | null>
): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: player.full_name,
    url: `${siteUrl}/players/${letter}/${id}`,
    description: `NBA player career statistics${player.position != null ? ` (${player.position})` : ''}`,
    sport: 'Basketball',
    nationality: { '@type': 'Country', name: 'United States' },
    ...(player.is_active === 1 ? { memberOf: { '@type': 'SportsTeam', name: 'NBA' } } : {}),
    ...(summary['pts_pg'] != null ? { award: `Career PPG: ${summary['pts_pg']}` } : {}),
  };
}

/**
 * Render a server-side player detail page.
 */
export default async function PlayerPage({ params }: PlayerPageProps): Promise<React.JSX.Element> {
  const { letter, id } = await params;

  if (!validateLetterMatch(letter, id)) {
    notFound();
  }

  validateBrefId(id);

  const playerPageData = getPlayerPageData(id);
  if (playerPageData?.player == null) notFound();
  const {
    adjustedShootingStats,
    advancedStats,
    awardCounts,
    awards,
    fullGameLog,
    highs,
    pbpStats,
    per100Stats,
    per36Stats,
    perGameStats,
    player,
    salaries,
    seasonStats,
    shootingStats,
    summary,
  } = playerPageData;
  const playerRelatedLinks = buildPlayerRelatedLinks(letter, id, player.full_name);
  const careerData = buildCareerData(perGameStats);

  const jsonLd = getPlayerJsonLd(letter, id, player, summary);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <StructuredData data={jsonLd} />
      {/* Breadcrumb navigation */}
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/players">Players</Link> / {player.full_name}
      </div>

      <PlayerBioHeader player={player} summary={summary} />
      <AwardsBadges awardCounts={awardCounts} />

      {/* Main content with sticky sidebar navigation */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sticky navigation sidebar */}
        <aside className="h-max surface-pedestal p-4 lg:sticky lg:top-3">
          <div className="mb-2 text-xs font-bold tracking-wide text-crumb uppercase">
            On this page
          </div>
          <nav aria-label="Player page sections" className="space-y-1 text-sm">
            {PLAYER_PAGE_ANCHOR_SECTIONS.map(section => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded px-2 py-1 hover:bg-nav-hover"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Statistics sections */}
        <div className="space-y-8">
          {/* Career Trajectory Chart */}
          <section className="mb-8 surface-altar p-5">
            <h2 className="mb-4 inscription-title text-xl">Career Trajectory</h2>
            <CareerTrajectoryChart data={careerData} />
          </section>

          {/* Per Game Stats */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="per-game" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Per Game</h2>
              <StatsTable columns={PER_GAME_COLUMNS} rows={perGameStats} initialSort="season_id" />
            </section>
          </Suspense>

          {/* Per 36 Minutes Stats */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="per-36" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Per 36 Minutes</h2>
              <StatsTable columns={PER_36_COLUMNS} rows={per36Stats} initialSort="season_id" />
            </section>
          </Suspense>

          {/* Season Totals */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="totals" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Totals</h2>
              <StatsTable columns={TOTALS_COLUMNS} rows={seasonStats} initialSort="season_id" />
            </section>
          </Suspense>

          {/* Per 100 Possessions Stats */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="per-100" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Per 100 Possessions</h2>
              <StatsTable columns={PER_100_COLUMNS} rows={per100Stats} initialSort="season_id" />
            </section>
          </Suspense>

          {/* Advanced Stats */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="advanced" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Advanced</h2>
              <StatsTable columns={ADVANCED_COLUMNS} rows={advancedStats} initialSort="season_id" />
            </section>
          </Suspense>

          {/* Shooting Stats (Distance Breakdown) */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="shooting" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Shooting</h2>
              <StatsTable columns={SHOOTING_COLUMNS} rows={shootingStats} initialSort="season_id" />
            </section>
          </Suspense>

          {/* Adjusted Shooting (League-Relative) */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="adjusted-shooting" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Adjusted Shooting</h2>
              <StatsTable
                columns={ADJUSTED_SHOOTING_COLUMNS}
                rows={adjustedShootingStats}
                initialSort="season_id"
              />
            </section>
          </Suspense>

          {/* Play-by-Play Derived Stats */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="pbp" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Play-by-Play</h2>
              <StatsTable columns={PBP_COLUMNS} rows={pbpStats} initialSort="season_id" />
            </section>
          </Suspense>

          {/* Full Game Log */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="game-log" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Game Log</h2>
              <StatsTable
                columns={GAME_LOG_COLUMNS}
                rows={fullGameLog.map(gameLogRow => ({
                  ...gameLogRow,
                  is_home: Number(gameLogRow['is_home']) === 1 ? 'Home' : 'Away',
                }))}
                initialSort="game_date"
              />
            </section>
          </Suspense>

          {/* Awards History */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="awards" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Awards History</h2>
              <StatsTable columns={AWARDS_COLUMNS} rows={awards} initialSort="season_id" />
            </section>
          </Suspense>

          {/* Salary History */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <section id="salaries" className="scroll-mt-4">
              <h2 className="mb-3 inscription-title text-xl">Salaries</h2>
              <StatsTable
                columns={SALARY_COLUMNS}
                rows={salaries.map(salaryRow => ({
                  ...salaryRow,
                  salary_fmt: formatUsd(salaryRow['salary'] as number | null),
                }))}
                initialSort="season_id"
              />
            </section>
          </Suspense>

          <GameHighs highs={highs} />
          <RelatedLinksPanel links={playerRelatedLinks} title="Related Links" />
        </div>
      </div>
    </main>
  );
}
