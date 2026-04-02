import type { JSX } from 'react';
import type { SearchEntityResult } from '@/lib/query/search-shared';

export const SEARCH_LABELS: Record<SearchEntityResult['type'], string> = {
  player: 'Player',
  team: 'Team',
  season: 'Season',
  game: 'Game',
  award: 'Award',
  page: 'Page',
};

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;

export function normalizeRecentSearch(query: string): string {
  return query.trim();
}

export function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored === null || stored.length === 0) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter((item): item is string => typeof item === 'string')
      .slice(0, MAX_RECENT_SEARCHES);
  } catch (_error: unknown) {
    return [];
  }
}

export function saveRecentSearch(query: string): string[] {
  const normalizedQuery = normalizeRecentSearch(query);
  if (normalizedQuery.length < 2) {
    return getRecentSearches();
  }

  const current = getRecentSearches();
  const updated = [normalizedQuery, ...current.filter(search => search !== normalizedQuery)].slice(
    0,
    MAX_RECENT_SEARCHES
  );

  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch (_error: unknown) {
    return current;
  }
}

export function HighlightedLabel({ label, query }: { label: string; query: string }): JSX.Element {
  if (query.length < 2) return <>{label}</>;

  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerLabel.indexOf(lowerQuery);
  if (idx === -1) return <>{label}</>;

  return (
    <>
      {label.slice(0, idx)}
      <mark className="bg-transparent font-bold text-[var(--dc-tertiary)]">
        {label.slice(idx, idx + query.length)}
      </mark>
      {label.slice(idx + query.length)}
    </>
  );
}
