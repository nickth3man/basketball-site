import type { Route } from 'next';
import { routes } from '@/lib/routes';
import { getSiteUrl } from '@/lib/site-config';

export const TEAM_PAGE_ANCHORS = [
  { id: 'summary', label: 'Summary' },
  { id: 'recent-games', label: 'Recent Games' },
  { id: 'roster', label: 'Roster' },
  { id: 'four-factors', label: 'Four Factors' },
  { id: 'team-stats', label: 'Team Stats' },
  { id: 'leaders', label: 'Player Leaders' },
  { id: 'history', label: 'Season History' },
] as const;

export const TEAM_SEASON_CHIP_CLASS =
  'rounded-md bg-[var(--dc-surface-container-highest)] px-2 py-1 text-xs outline outline-1 outline-[color-mix(in_srgb,var(--dc-outline-variant)_12%,transparent)] transition-all hover:bg-button-hover';

export function getTeamJsonLd(
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
    ...(team.conference != null
      ? { memberOf: { '@type': 'SportsOrganization', name: `NBA ${team.conference} Conference` } }
      : {}),
    ...(current?.['w'] != null && current['l'] != null
      ? {
          additionalProperty: [
            { '@type': 'PropertyValue', name: 'Wins', value: current['w'] },
            { '@type': 'PropertyValue', name: 'Losses', value: current['l'] },
          ],
        }
      : {}),
  };
}

export function buildTeamRelatedLinks(
  abbreviation: string,
  fullName: string,
  currentSeasonEndYear: string | null
): Array<{ href: Route; label: string; description: string }> {
  return [
    currentSeasonEndYear == null
      ? null
      : {
          href: `/teams/${abbreviation}/${currentSeasonEndYear}` as Route,
          label: 'Current Season Page',
          description: 'Jump into the team-specific breakdown for the latest season.',
        },
    {
      href: `/teams/${abbreviation}/franchise` as Route,
      label: 'Franchise History',
      description: 'Browse the franchise timeline, relocations, and historical summary.',
    },
    {
      href: `/teams/${abbreviation}/salaries` as Route,
      label: 'Salary History',
      description: 'Review team salary commitments across seasons.',
    },
    {
      href: routes.search(fullName),
      label: 'Search This Team',
      description: 'Use site-wide search to find seasons, games, and related pages for this team.',
    },
    {
      href: '/standings' as Route,
      label: 'Standings By Date',
      description: 'Compare this team against historical standings snapshots.',
    },
  ].filter(link => link != null);
}
