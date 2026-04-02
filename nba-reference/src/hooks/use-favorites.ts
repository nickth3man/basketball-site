/**
 * @fileoverview Client hook for managing favorites in localStorage.
 *
 * Provides persistent storage for starred players and teams.
 *
 * @module @/hooks/use-favorites
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

export type FavoriteType = 'player' | 'team';

export interface Favorite {
  id: string;
  type: FavoriteType;
  name: string;
  addedAt: string;
}

const STORAGE_KEY = 'nba-reference-favorites';

function isStoredFavorite(value: unknown): value is Favorite {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    (candidate['type'] === 'player' || candidate['type'] === 'team') &&
    typeof candidate['name'] === 'string' &&
    typeof candidate['addedAt'] === 'string'
  );
}

function loadFavorites(): Favorite[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored == null || stored.length === 0) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isStoredFavorite);
  } catch (_error: unknown) {
    return [];
  }
}

export function useFavorites(): {
  favorites: Favorite[];
  addFavorite: (id: string, type: FavoriteType, name: string) => void;
  removeFavorite: (id: string, type: FavoriteType) => void;
  isFavorite: (id: string, type: FavoriteType) => boolean;
  isLoaded: boolean;
} {
  const [favorites, setFavorites] = useState<Favorite[]>(loadFavorites);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (_error: unknown) {
      return;
    }
  }, [favorites]);

  const addFavorite = useCallback((id: string, type: FavoriteType, name: string): void => {
    setFavorites(prev => {
      if (prev.some(f => f.id === id && f.type === type)) return prev;
      return [...prev, { id, type, name, addedAt: new Date().toISOString() }];
    });
  }, []);

  const removeFavorite = useCallback((id: string, type: FavoriteType): void => {
    setFavorites(prev => prev.filter(f => !(f.id === id && f.type === type)));
  }, []);

  const isFavorite = useCallback(
    (id: string, type: FavoriteType): boolean =>
      favorites.some(f => f.id === id && f.type === type),
    [favorites]
  );

  // Favorites are loaded synchronously from localStorage on first render.
  // No async loading state is needed — the initial state is always available.
  const isLoaded = true;

  return { favorites, addFavorite, removeFavorite, isFavorite, isLoaded };
}
