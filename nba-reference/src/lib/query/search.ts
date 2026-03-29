/**
 * @fileoverview Search functionality - finds players, teams, seasons, games, and awards.
 *
 * Provides cross-entity search with:
 * - Case-insensitive matching
 * - Typed result categories with canonical hrefs
 * - Optional type filtering for dedicated search pages
 * - Short query filtering (minimum 2 characters)
 *
 * @module @/lib/query/search
 */

import { getCachedQueryMany } from '@/lib/db';
import { fuzzyScore } from '@/lib/fuzzy';
import { routes } from '@/lib/routes';
import { seasonIdToLeagueSlug } from '@/lib/season-utils';
import type { Route } from 'next';

export const SEARCH_RESULT_TYPES = ['player', 'team', 'season', 'game', 'award', 'page'] as const;

export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export interface SearchEntityResult {
  description: string | null;
  href: Route;
  id: string;
  label: string;
  type: SearchResultType;
}

export interface SearchEntitiesOptions {
  limit?: number;
  types?: SearchResultType[];
}

interface SearchRow {
  description: string | null;
  id: string;
  label: string;
}

interface SearchStaticDefinition {
  description: string;
  href: Route;
  id: string;
  keywords: string[];
  label: string;
}

const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  player: 'Players',
  team: 'Teams',
  season: 'Seasons',
  game: 'Games',
  award: 'Awards',
  page: 'Pages',
};

const DEFAULT_RESULTS_LIMIT = 24;
const SEARCH_TYPE_ORDER: SearchResultType[] = ['player', 'team', 'season', 'game', 'award', 'page'];

const SEARCHABLE_AWARDS: SearchStaticDefinition[] = [
  {
    id: 'mvp',
    label: 'Most Valuable Player',
    description: 'Season-by-season MVP winners and history.',
    href: '/awards/mvp',
    keywords: ['mvp', 'most valuable player', 'michael jordan trophy'],
  },
  {
    id: 'dpoy',
    label: 'Defensive Player of the Year',
    description: 'DPOY winners and voting history.',
    href: '/awards/dpoy',
    keywords: ['dpoy', 'defensive player of the year', 'defense', 'hakeem olajuwon trophy'],
  },
  {
    id: 'roy',
    label: 'Rookie of the Year',
    description: 'ROY winners and first-year standouts.',
    href: '/awards/roy',
    keywords: ['roy', 'rookie of the year', 'rookie', 'wilt chamberlain trophy'],
  },
  {
    id: 'all-nba',
    label: 'All-NBA Teams',
    description: 'All-NBA first, second, and third team history.',
    href: '/awards/all_league',
    keywords: ['all nba', 'all-nba', 'all league', 'all team'],
  },
  {
    id: 'all-defense',
    label: 'All-Defensive Teams',
    description: 'All-Defensive first and second team history.',
    href: '/awards/all_defense',
    keywords: ['all defense', 'all-defense', 'all defensive', 'defensive teams'],
  },
];

const SEARCHABLE_SITE_PAGES: SearchStaticDefinition[] = [
  {
    id: 'games-index',
    label: 'Games Index',
    description: 'Browse recent NBA results with optional team filters.',
    href: '/games',
    keywords: ['games', 'schedule', 'results', 'scores'],
  },
  {
    id: 'boxscores',
    label: 'Box Scores',
    description: 'Jump into date-based box score browsing and game detail pages.',
    href: '/boxscores',
    keywords: ['box score', 'boxscores', 'pbp', 'play by play'],
  },
  {
    id: 'seasons-index',
    label: 'Seasons',
    description: 'Explore season indexes, standings, leaders, and recent games.',
    href: '/seasons',
    keywords: ['seasons', 'season history', 'league history'],
  },
  {
    id: 'leaders',
    label: 'League Leaders',
    description: 'Stat leaderboards and top performers across the league.',
    href: '/leaders',
    keywords: ['leaders', 'leaderboards', 'scoring leaders', 'assist leaders'],
  },
  {
    id: 'standings',
    label: 'Standings by Date',
    description: 'Look up standings snapshots across the season.',
    href: '/standings',
    keywords: ['standings', 'rankings', 'record', 'seedings'],
  },
  {
    id: 'playoffs',
    label: 'Playoffs',
    description: 'Series pages, playoff leaders, and postseason history.',
    href: '/playoffs',
    keywords: ['playoffs', 'postseason', 'series', 'bracket'],
  },
  {
    id: 'draft',
    label: 'Draft History',
    description: 'Draft classes, picks, and team selections by year.',
    href: '/draft',
    keywords: ['draft', 'nba draft', 'rookies', 'draft class'],
  },
  {
    id: 'allstar',
    label: 'All-Star History',
    description: 'All-Star rosters, MVP winners, and yearly event history.',
    href: '/allstar',
    keywords: ['all star', 'all-star', 'allstar', 'all-star game'],
  },
  {
    id: 'salary-cap',
    label: 'Salary Cap History',
    description: 'Salary cap and league spending context by season.',
    href: '/leagues/salary-cap',
    keywords: ['salary cap', 'cap', 'luxury tax', 'cba'],
  },
  {
    id: 'birthdays',
    label: 'Player Birthdays',
    description: 'Browse NBA players by birthday and date.',
    href: '/friv/birthdays',
    keywords: ['birthdays', 'birthday', 'born on'],
  },
  {
    id: 'colleges',
    label: 'Players by College',
    description: 'See which colleges produced the most NBA players.',
    href: '/friv/colleges',
    keywords: ['colleges', 'college', 'alma mater', 'school'],
  },
];

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function clampLimit(limit: number | undefined): number {
  if (limit == null || !Number.isFinite(limit)) {
    return DEFAULT_RESULTS_LIMIT;
  }

  return Math.max(1, Math.min(Math.floor(limit), 240));
}

function filterTypes(types: SearchResultType[] | undefined): SearchResultType[] {
  if (types == null || types.length === 0) {
    return [...SEARCH_TYPE_ORDER];
  }

  const requested = new Set(types);
  return SEARCH_TYPE_ORDER.filter(type => requested.has(type));
}

function limitPerType(totalLimit: number, typeCount: number): number {
  const baseLimit = Math.ceil(totalLimit / Math.max(typeCount, 1));
  return Math.max(4, baseLimit);
}

function buildPlayerResults(normalizedQuery: string, resultLimit: number): SearchEntityResult[] {
  const containsQuery = `%${normalizedQuery}%`;
  const startsWithQuery = `${normalizedQuery}%`;

  const players = getCachedQueryMany<SearchRow[]>(
    `SELECT p.bref_id AS id,
            p.full_name AS label,
            CASE
              WHEN p.position IS NOT NULL AND p.is_active = 1 THEN p.position || ' · Active'
              WHEN p.position IS NOT NULL THEN p.position
              WHEN p.is_active = 1 THEN 'Active player'
              ELSE NULL
            END AS description
     FROM dim_player p
     WHERE p.bref_id IS NOT NULL
       AND LOWER(p.full_name) LIKE ?
       AND EXISTS (
         SELECT 1
         FROM fact_player_season_stats fps
         WHERE fps.bref_player_id = p.bref_id
           AND fps.lg = 'NBA'
       )
     ORDER BY
       CASE
         WHEN LOWER(p.full_name) = ? THEN 0
         WHEN LOWER(p.full_name) LIKE ? THEN 1
         ELSE 2
       END,
       p.is_active DESC,
       p.full_name ASC
     LIMIT ?`,
    [containsQuery, normalizedQuery, startsWithQuery, resultLimit],
    5_000
  );

  return players.map(player => ({
    ...player,
    href: routes.player(player.id.slice(0, 1), player.id),
    type: 'player',
  }));
}

function buildTeamResults(normalizedQuery: string, resultLimit: number): SearchEntityResult[] {
  const containsQuery = `%${normalizedQuery}%`;
  const startsWithQuery = `${normalizedQuery}%`;

  const teams = getCachedQueryMany<SearchRow[]>(
    `SELECT t.abbreviation AS id,
            t.full_name AS label,
            CASE
              WHEN t.conference IS NOT NULL AND t.division IS NOT NULL THEN t.conference || ' · ' || t.division
              WHEN t.conference IS NOT NULL THEN t.conference
              ELSE NULL
            END AS description
     FROM dim_team t
     WHERE (
         LOWER(t.full_name) LIKE ?
         OR LOWER(t.abbreviation) LIKE ?
       )
       AND EXISTS (
         SELECT 1
         FROM fact_team_season ts
         WHERE ts.bref_abbrev = t.bref_abbrev
           AND ts.lg = 'NBA'
       )
     ORDER BY
       CASE
         WHEN LOWER(t.abbreviation) = ? THEN 0
         WHEN LOWER(t.full_name) = ? THEN 1
         WHEN LOWER(t.abbreviation) LIKE ? OR LOWER(t.full_name) LIKE ? THEN 2
         ELSE 3
       END,
       t.full_name ASC
     LIMIT ?`,
    [
      containsQuery,
      containsQuery,
      normalizedQuery,
      normalizedQuery,
      startsWithQuery,
      startsWithQuery,
      resultLimit,
    ],
    5_000
  );

  return teams.map(team => ({
    ...team,
    href: routes.team(team.id),
    type: 'team',
  }));
}

function buildSeasonResults(normalizedQuery: string, resultLimit: number): SearchEntityResult[] {
  const containsQuery = `%${normalizedQuery}%`;

  const seasons = getCachedQueryMany<SearchRow[]>(
    `SELECT s.season_id AS id,
            s.season_id AS label,
            'NBA season · ' || s.start_year || '-' || s.end_year AS description
     FROM dim_season s
     WHERE s.season_id LIKE ?
        OR CAST(s.start_year AS TEXT) LIKE ?
        OR CAST(s.end_year AS TEXT) LIKE ?
     ORDER BY s.start_year DESC
     LIMIT ?`,
    [containsQuery, containsQuery, containsQuery, resultLimit],
    30_000
  );

  return seasons.map(season => ({
    ...season,
    href: routes.league(seasonIdToLeagueSlug(season.id) ?? season.id),
    type: 'season',
  }));
}

function buildGameResults(normalizedQuery: string, resultLimit: number): SearchEntityResult[] {
  const containsQuery = `%${normalizedQuery}%`;

  const games = getCachedQueryMany<SearchRow[]>(
    `SELECT g.game_id AS id,
            at.abbreviation || ' at ' || ht.abbreviation AS label,
            g.game_date || CASE
              WHEN g.away_score IS NOT NULL AND g.home_score IS NOT NULL
                THEN ' · ' || at.abbreviation || ' ' || g.away_score || '-' || g.home_score || ' ' || ht.abbreviation
              ELSE ''
            END AS description
     FROM fact_game g
     JOIN dim_team ht ON ht.team_id = g.home_team_id
     JOIN dim_team at ON at.team_id = g.away_team_id
     WHERE g.game_id LIKE ?
        OR g.game_date LIKE ?
        OR LOWER(ht.full_name) LIKE ?
        OR LOWER(at.full_name) LIKE ?
        OR LOWER(ht.abbreviation) LIKE ?
        OR LOWER(at.abbreviation) LIKE ?
     ORDER BY g.game_date DESC, g.game_id DESC
     LIMIT ?`,
    [
      containsQuery,
      containsQuery,
      containsQuery,
      containsQuery,
      containsQuery,
      containsQuery,
      resultLimit,
    ],
    10_000
  );

  return games.map(game => ({
    ...game,
    href: routes.boxscore(game.id),
    type: 'game',
  }));
}

function buildStaticResults(
  definitions: SearchStaticDefinition[],
  normalizedQuery: string,
  resultLimit: number,
  type: SearchResultType
): SearchEntityResult[] {
  const results = definitions
    .filter(definition =>
      [definition.label, definition.description, ...definition.keywords].some(value =>
        value.toLowerCase().includes(normalizedQuery)
      )
    )
    .slice(0, resultLimit);

  return results.map(result => ({
    description: result.description,
    href: result.href,
    id: result.id,
    label: result.label,
    type,
  }));
}

function buildAwardResults(normalizedQuery: string, resultLimit: number): SearchEntityResult[] {
  return buildStaticResults(SEARCHABLE_AWARDS, normalizedQuery, resultLimit, 'award');
}

function buildPageResults(normalizedQuery: string, resultLimit: number): SearchEntityResult[] {
  return buildStaticResults(SEARCHABLE_SITE_PAGES, normalizedQuery, resultLimit, 'page');
}

export function getSearchTypeLabel(type: SearchResultType): string {
  return SEARCH_TYPE_LABELS[type];
}

export function searchEntities(
  query: string,
  options: SearchEntitiesOptions = {}
): SearchEntityResult[] {
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const types = filterTypes(options.types);
  const resultLimit = clampLimit(options.limit);
  const perTypeLimit = limitPerType(resultLimit, types.length);
  const results: SearchEntityResult[] = [];

  for (const type of types) {
    switch (type) {
      case 'player':
        results.push(...buildPlayerResults(normalizedQuery, perTypeLimit));
        break;
      case 'team':
        results.push(...buildTeamResults(normalizedQuery, perTypeLimit));
        break;
      case 'season':
        results.push(...buildSeasonResults(normalizedQuery, perTypeLimit));
        break;
      case 'game':
        results.push(...buildGameResults(normalizedQuery, perTypeLimit));
        break;
      case 'award':
        results.push(...buildAwardResults(normalizedQuery, perTypeLimit));
        break;
      case 'page':
        results.push(...buildPageResults(normalizedQuery, perTypeLimit));
        break;
    }
  }

  const ranked = results.map(result => {
    const { score } = fuzzyScore(normalizedQuery, result.label);
    return { result, score };
  });

  ranked.sort((a, b) => b.score - a.score);

  return ranked.map(entry => entry.result).slice(0, resultLimit);
}
