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

function isSavedViewType(value: unknown): value is SavedView['type'] {
  return value === 'search' || value === 'compare' || value === 'leaders' || value === 'standings';
}

function isSavedView(value: unknown): value is SavedView {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['name'] === 'string' &&
    typeof candidate['url'] === 'string' &&
    isSavedViewType(candidate['type']) &&
    typeof candidate['createdAt'] === 'string'
  );
}

function loadSavedViews(): SavedView[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored != null && stored.length > 0) {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(isSavedView);
    }
  } catch (_error: unknown) {
    return [];
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
    } catch (_error: unknown) {
      return;
    }
  }, [savedViews]);

  const saveView = useCallback((name: string, url: string, type: SavedView['type']): void => {
    const id = `${type}-${Date.now()}`;
    setSavedViews(prev => [...prev, { id, name, url, type, createdAt: new Date().toISOString() }]);
  }, []);

  const removeView = useCallback((id: string): void => {
    setSavedViews(prev => prev.filter(v => v.id !== id));
  }, []);

  // Saved views are loaded synchronously from localStorage on first render.
  // No async loading state is needed — the initial state is always available.
  return { savedViews, saveView, removeView, isLoaded: true };
}
