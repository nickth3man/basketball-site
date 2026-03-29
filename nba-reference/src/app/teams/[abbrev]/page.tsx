/**
 * @fileoverview Team detail page - comprehensive team statistics dashboard.
 *
 * Displays team information including:
 * - Team profile (name, conference, division, arena, record)
 * - Per-game averages (PTS, REB, AST, STL, BLK, TOV, etc.)
 * - Recent games with W/L results
 * - Current roster with player stats
 * - Four Factors comparison (team vs opponent)
 * - Season-by-season team statistics
 * - Player statistical leaders
 *
 * Uses sticky sidebar navigation for easy section access.
 *
 * @module @/app/teams/[abbrev]/page
 */

import type { JSX } from 'react';
import type { Metadata } from 'next';
import type { Route } from 'next';
import Link from 'next/link';
import { StarButton } from '@/components/favorites';
import { RelatedLinksPanel } from '@/components/related-links-panel';
import { StatsTable } from '@/components/stats-table';
import { StructuredData } from '@/components/structured-data';
import { formatSignedNumber } from '@/lib/formatters';
import { getTeamPageData } from '@/lib/query';
import { routes } from '@/lib/routes';
import { getSiteUrl } from '@/lib/site-config';
import { notFound } from 'next/navigation';
import { validateTeamAbbrev } from '@/lib/validation';
import { seasonIdToEndYear } from '@/lib/season-utils';

interface TeamPageParams {
  params: Promise<{ abbrev: string }>;
}

export async function generateMetadata({ params }: TeamPageParams): Promise<Metadata> {
  const { abbrev } = await params;
  try {
    validateTeamAbbrev(abbrev.toUpperCase());
  } catch {
    return {};
  }

  const teamPageData = getTeamPageData(abbrev.toUpperCase());
  const team = teamPageData?.team;
  if (team == null) return {};

  const siteUrl = getSiteUrl();
  const title = `${team.full_name} Stats | NBA Reference`;
  const description = `Complete team statistics for the ${team.full_name}. View roster, schedule, four factors, leaders, and franchise history.`;
  const url = `${siteUrl}/teams/${abbrev.toUpperCase()}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

function getTeamJsonLd(
  abbrev: string,
  team: { full_name: string; conference: string | null; division: string | null },
  current: Record<string, unknown> | null
): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: team.full_name,
    url: `${siteUrl}/teams/${abbrev}`,
    sport: 'Basketball',
    ...(team.conference != null ? { memberOf: { '@type': 'SportsOrganization', name: `NBA ${team.conference} Conference` } } : {}),
    ...(current?.['w'] != null && current['l'] != null
      ? { additionalProperty: [
          { '@type': 'PropertyValue', name: 'Wins', value: current['w'] },
          { '@type': 'PropertyValue', name: 'Losses', value: current['l'] },
        ] }
      : {}),
  };
}

export default async function TeamPage({
  params,
}: TeamPageParams): Promise<JSX.Element> {
  const { abbrev } = await params;

  // Validate team abbreviation format before querying
  validateTeamAbbrev(abbrev.toUpperCase());

  const teamPageData = getTeamPageData(abbrev.toUpperCase());
  if (teamPageData?.team == null) notFound();
  const {
    averages,
    current,
    fourFactors,
    leaders,
    recentGames,
    roster,
    seasonLabel,
    seasonLinks,
    seasonStats,
    team,
  } = teamPageData;
  const currentSeasonEndYear =
    typeof seasonLabel === 'string' ? (seasonIdToEndYear(seasonLabel)?.toString() ?? null) : null;
  const relatedLinks = [
    currentSeasonEndYear == null
      ? null
      : {
          href: `/teams/${team.abbreviation}/${currentSeasonEndYear}` as Route,
          label: 'Current Season Page',
          description: 'Jump into the team-specific breakdown for the latest season.',
        },
    {
      href: `/teams/${team.abbreviation}/franchise` as Route,
      label: 'Franchise History',
      description: 'Browse the franchise timeline, relocations, and historical summary.',
    },
    {
      href: `/teams/${team.abbreviation}/salaries` as Route,
      label: 'Salary History',
      description: 'Review team salary commitments across seasons.',
    },
    {
      href: routes.search(team.full_name),
      label: 'Search This Team',
      description: 'Use site-wide search to find seasons, games, and related pages for this team.',
    },
    {
      href: '/standings' as Route,
      label: 'Standings By Date',
      description: 'Compare this team against historical standings snapshots.',
    },
  ].filter(link => link != null);

  // Navigation anchors for sticky sidebar
  const anchors = [
    { id: 'summary', label: 'Summary' },
    { id: 'recent-games', label: 'Recent Games' },
    { id: 'roster', label: 'Roster' },
    { id: 'four-factors', label: 'Four Factors' },
    { id: 'team-stats', label: 'Team Stats' },
    { id: 'leaders', label: 'Player Leaders' },
    { id: 'history', label: 'Season History' },
  ];

  const seasonChipClass =
    'rounded-md bg-[var(--dc-surface-container-highest)] px-2 py-1 text-xs outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] transition-all hover:bg-button-hover';
  const jsonLd = getTeamJsonLd(team.abbreviation, team, current ?? null);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <StructuredData data={jsonLd} />
      {/* Breadcrumb navigation */}
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/teams">Teams</Link> / {team.abbreviation}
      </div>

      {/* Team profile header */}
      <section id="summary" className="mb-6 surface-altar p-5">
        <div className="mb-2 text-xs text-crumb">{seasonLabel} Team Profile</div>
        <div className="mb-2 flex items-center gap-2">
          <h1 className="inscription-title text-3xl">{team.full_name}</h1>
          <StarButton id={team.abbreviation} type="team" name={team.full_name} />
        </div>

        {/* Team metadata grid */}
        <div className="grid gap-2 text-sm text-muted-strong md:grid-cols-3">
          <div>Conference: {team.conference ?? '-'}</div>
          <div>Division: {team.division ?? '-'}</div>
          <div>Arena: {current?.['arena'] ?? team.arena_name ?? '-'}</div>
          <div>
            Record: {current?.['w'] ?? '-'}-{current?.['l'] ?? '-'}
          </div>
          <div>Net Rtg: {formatSignedNumber(current?.['n_rtg'] as number | null)}</div>
          <div>Pace: {current?.['pace'] ?? '-'}</div>
          <div>Off Rtg: {current?.['o_rtg'] ?? '-'}</div>
          <div>Def Rtg: {current?.['d_rtg'] ?? '-'}</div>
          <div>SRS: {formatSignedNumber(current?.['srs'] as number | null)}</div>
        </div>

        {/* Per-game averages display */}
        {averages ? (
          <div className="mt-4 grid gap-3 surface-inset p-4 text-xs sm:grid-cols-5 lg:grid-cols-10">
            <div>
              PTS/G: <span className="font-bold tabular-nums">{averages['pts'] ?? '-'}</span>
            </div>
            <div>
              REB/G: <span className="font-bold tabular-nums">{averages['reb'] ?? '-'}</span>
            </div>
            <div>
              AST/G: <span className="font-bold tabular-nums">{averages['ast'] ?? '-'}</span>
            </div>
            <div>
              STL/G: <span className="font-bold tabular-nums">{averages['stl'] ?? '-'}</span>
            </div>
            <div>
              BLK/G: <span className="font-bold tabular-nums">{averages['blk'] ?? '-'}</span>
            </div>
            <div>
              TOV/G: <span className="font-bold tabular-nums">{averages['tov'] ?? '-'}</span>
            </div>
            <div>
              3PM/G: <span className="font-bold tabular-nums">{averages['fg3m'] ?? '-'}</span>
            </div>
            <div>
              3PA/G: <span className="font-bold tabular-nums">{averages['fg3a'] ?? '-'}</span>
            </div>
            <div>
              FG%: <span className="font-bold tabular-nums">{averages['fg_pct'] ?? '-'}</span>
            </div>
            <div>
              FT%: <span className="font-bold tabular-nums">{averages['ft_pct'] ?? '-'}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-muted-strong">Season Pages:</span>
          {seasonLinks.map(rowSeasonId => {
            const endYear = seasonIdToEndYear(rowSeasonId);
            if (endYear == null) return null;

            return (
              <Link
                key={rowSeasonId}
                href={`/teams/${team.abbreviation}/${endYear}` as Route}
                className={seasonChipClass}
              >
                {rowSeasonId}
              </Link>
            );
          })}
          <Link href={`/teams/${team.abbreviation}/salaries` as Route} className={seasonChipClass}>
            Salaries
          </Link>
        </div>
      </section>

      {/* Main content with sticky sidebar */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sticky navigation sidebar */}
        <aside className="h-max surface-pedestal p-4 lg:sticky lg:top-3">
          <div className="mb-2 text-xs font-bold tracking-wide text-crumb uppercase">
            On this page
          </div>
          <nav aria-label="Team page sections" className="space-y-1 text-sm">
            {anchors.map(anchor => (
              <a
                key={anchor.id}
                href={`#${anchor.id}`}
                className="block rounded px-2 py-1 hover:bg-nav-hover"
              >
                {anchor.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Statistics sections */}
        <div className="space-y-8">
          {/* Recent Games */}
          <section id="recent-games">
            <h2 className="mb-2 text-xl font-bold">Recent Games</h2>
            <StatsTable
              columns={[
                { key: 'game_date', label: 'Date' },
                { key: 'result', label: 'W/L' },
                { key: 'opp_abbrev', label: 'Opp', link: { type: 'team' } },
                { key: 'is_home', label: 'Site' },
                { key: 'team_score', label: 'Team', align: 'right' },
                { key: 'opp_score', label: 'Opp', align: 'right' },
                { key: 'game_id', label: 'Game ID', link: { type: 'boxscore' } },
              ]}
              rows={recentGames.map(recentGame => ({
                ...recentGame,
                is_home: Number(recentGame['is_home']) === 1 ? 'Home' : 'Away',
              }))}
              initialSort="game_date"
              tableId="team-recent-games"
            />
          </section>

          {/* Current Roster */}
          <section id="roster">
            <h2 className="mb-2 text-xl font-bold">Roster</h2>
            <StatsTable
              columns={[
                {
                  key: 'full_name',
                  label: 'Player',
                  link: { type: 'player', valueKey: 'bref_id' },
                },
                { key: 'position', label: 'Pos' },
                { key: 'g', label: 'G', align: 'right' },
                { key: 'pts_pg', label: 'PTS', align: 'right' },
                { key: 'reb_pg', label: 'REB', align: 'right' },
                { key: 'ast_pg', label: 'AST', align: 'right' },
                { key: 'height_cm', label: 'Height (cm)', align: 'right' },
                { key: 'weight_kg', label: 'Weight (kg)', align: 'right' },
                { key: 'birth_date', label: 'Birth Date' },
              ]}
              rows={roster}
              initialSort="pts_pg"
              tableId="team-roster"
            />
          </section>

          {/* Four Factors Comparison */}
          <section id="four-factors">
            <h2 className="mb-2 text-xl font-bold">Four Factors (Team vs Opponent)</h2>
            <StatsTable
              columns={[
                { key: 'side', label: 'Side' },
                { key: 'efg_pct', label: 'eFG%', align: 'right' },
                { key: 'tov_pct', label: 'TOV%', align: 'right' },
                { key: 'orb_pct', label: 'ORB%', align: 'right' },
                { key: 'ft_fga', label: 'FT/FGA', align: 'right' },
              ]}
              rows={
                fourFactors
                  ? [
                      {
                        side: 'Team',
                        efg_pct: fourFactors['e_fg_pct'] ?? null,
                        tov_pct: fourFactors['tov_pct'] ?? null,
                        orb_pct: fourFactors['orb_pct'] ?? null,
                        ft_fga: fourFactors['ft_fga'] ?? null,
                      },
                      {
                        side: 'Opponent',
                        efg_pct: fourFactors['opp_e_fg_pct'] ?? null,
                        tov_pct: fourFactors['opp_tov_pct'] ?? null,
                        // Calculate opponent ORB% from team DRB%
                        orb_pct:
                          fourFactors['drb_pct'] == null
                            ? null
                            : 100 - Number(fourFactors['drb_pct']),
                        ft_fga: fourFactors['opp_ft_fga'] ?? null,
                      },
                    ]
                  : []
              }
              initialSort="side"
            />
          </section>

          {/* Team Season Stats */}
          <section id="team-stats">
            <h2 className="mb-2 text-xl font-bold">Team Misc / Efficiency</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season', link: { type: 'league' } },
                { key: 'w', label: 'W', align: 'right' },
                { key: 'l', label: 'L', align: 'right' },
                { key: 'mov', label: 'MOV', align: 'right' },
                { key: 'srs', label: 'SRS', align: 'right' },
                { key: 'o_rtg', label: 'ORtg', align: 'right' },
                { key: 'd_rtg', label: 'DRtg', align: 'right' },
                { key: 'n_rtg', label: 'NRtg', align: 'right' },
                { key: 'pace', label: 'Pace', align: 'right' },
                { key: 'ts_pct', label: 'TS%', align: 'right' },
                { key: 'e_fg_pct', label: 'eFG%', align: 'right' },
                { key: 'tov_pct', label: 'TOV%', align: 'right' },
              ]}
              rows={seasonStats}
              initialSort="season_id"
              tableId="team-stats"
            />
          </section>

          {/* Player Leaders */}
          <section id="leaders">
            <h2 className="mb-2 text-xl font-bold">Player Leaders (Current Season)</h2>
            <StatsTable
              columns={[
                {
                  key: 'full_name',
                  label: 'Player',
                  link: { type: 'player', valueKey: 'bref_id' },
                },
                { key: 'g', label: 'G', align: 'right' },
                { key: 'pts_pg', label: 'PTS', align: 'right' },
                { key: 'reb_pg', label: 'REB', align: 'right' },
                { key: 'ast_pg', label: 'AST', align: 'right' },
                { key: 'pts', label: 'Tot PTS', align: 'right' },
              ]}
              rows={leaders}
              initialSort="pts_pg"
              tableId="team-leaders"
            />
          </section>

          {/* Season History */}
          <section id="history">
            <h2 className="mb-2 text-xl font-bold">Season History</h2>
            <StatsTable
              columns={[
                { key: 'season_id', label: 'Season', link: { type: 'league' } },
                { key: 'w', label: 'W', align: 'right' },
                { key: 'l', label: 'L', align: 'right' },
                { key: 'o_rtg', label: 'ORtg', align: 'right' },
                { key: 'd_rtg', label: 'DRtg', align: 'right' },
                { key: 'n_rtg', label: 'NRtg', align: 'right' },
                { key: 'pace', label: 'Pace', align: 'right' },
              ]}
              rows={seasonStats}
              initialSort="season_id"
              tableId="team-history"
            />
          </section>
          <RelatedLinksPanel links={relatedLinks} title="Related Links" />
        </div>
      </div>
    </main>
  );
}
