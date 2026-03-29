'use client';

import { useCallback, useEffect, useState } from 'react';

export interface SavedView {
  id: string;
  name: string;
  url: string;
  type: 'search' | 'compare' | 'leaders' | 'standings';
  createdAt: string;
}

const STORAGE_KEY = 'nba-reference-saved-views';

function loadSavedViews(): SavedView[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored != null && stored.length > 0) {
      return JSON.parse(stored) as SavedView[];
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

export function useSavedViews(): {
  savedViews: SavedView[];
  saveView: (name: string, url: string, type: SavedView['type']) => void;
  removeView: (id: string) => void;
  isLoaded: boolean;
} {
  const [savedViews, setSavedViews] = useState<SavedView[]>(loadSavedViews);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedViews));
    } catch {
      // Ignore storage errors
    }
  }, [savedViews]);

  const saveView = useCallback((name: string, url: string, type: SavedView['type']): void => {
    const id = `${type}-${Date.now()}`;
    setSavedViews(prev => [...prev, { id, name, url, type, createdAt: new Date().toISOString() }]);
  }, []);

  const removeView = useCallback((id: string): void => {
    setSavedViews(prev => prev.filter(v => v.id !== id));
  }, []);

  return { savedViews, saveView, removeView, isLoaded: true };
}
