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

export function useFavorites(): {
  favorites: Favorite[];
  addFavorite: (id: string, type: FavoriteType, name: string) => void;
  removeFavorite: (id: string, type: FavoriteType) => void;
  isFavorite: (id: string, type: FavoriteType) => boolean;
  isLoaded: boolean;
} {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored != null && stored.length > 0) setFavorites(JSON.parse(stored) as Favorite[]);
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

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

  return { favorites, addFavorite, removeFavorite, isFavorite, isLoaded };
}
