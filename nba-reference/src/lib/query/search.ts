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
import { routes } from '@/lib/routes';
import { seasonIdToLeagueSlug } from '@/lib/season-utils';
import type { Route } from 'next';

export const SEARCH_RESULT_TYPES = ['player', 'team', 'season', 'game', 'award'] as const;

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

interface SearchAwardDefinition {
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
};

const DEFAULT_RESULTS_LIMIT = 24;
const SEARCH_TYPE_ORDER: SearchResultType[] = ['player', 'team', 'season', 'game', 'award'];

const SEARCHABLE_AWARDS: SearchAwardDefinition[] = [
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

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function clampLimit(limit: number | undefined): number {
  if (limit == null || !Number.isFinite(limit)) {
    return DEFAULT_RESULTS_LIMIT;
  }

  return Math.max(1, Math.min(Math.floor(limit), 50));
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

function buildAwardResults(normalizedQuery: string, resultLimit: number): SearchEntityResult[] {
  const awards = SEARCHABLE_AWARDS.filter(award =>
    [award.label, ...award.keywords].some(value => value.toLowerCase().includes(normalizedQuery))
  ).slice(0, resultLimit);

  return awards.map(award => ({
    description: award.description,
    href: award.href,
    id: award.id,
    label: award.label,
    type: 'award',
  }));
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
    }
  }

  return results.slice(0, resultLimit);
}
