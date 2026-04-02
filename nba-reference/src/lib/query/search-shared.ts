import type { Route } from 'next';

export const SEARCH_RESULT_TYPES = ['player', 'team', 'season', 'game', 'award', 'page'] as const;
export const SEARCH_API_RESULT_LIMIT = 8;

export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export interface SearchEntityResult {
  description: string | null;
  href: Route;
  id: string;
  label: string;
  type: SearchResultType;
}

const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  player: 'Players',
  team: 'Teams',
  season: 'Seasons',
  game: 'Games',
  award: 'Awards',
  page: 'Pages',
};

export function getSearchTypeLabel(type: SearchResultType): string {
  return SEARCH_TYPE_LABELS[type];
}

export function normalizeSearchQuery(query: string | null | undefined): string {
  return query?.trim() ?? '';
}

export function parseSearchResultType(
  value: string | null | undefined
): SearchResultType | undefined {
  const normalizedValue = normalizeSearchQuery(value).toLowerCase();
  return SEARCH_RESULT_TYPES.find(type => type === normalizedValue);
}
