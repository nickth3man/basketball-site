'use client';

import type { JSX } from 'react';
import { useFavorites, type FavoriteType } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';

interface StarButtonProps {
  id: string;
  type: FavoriteType;
  name: string;
  className?: string;
}

export function StarButton({ id, type, name, className }: StarButtonProps): JSX.Element {
  const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();
  const favorited = isFavorite(id, type);

  if (!isLoaded) return <div className={cn('h-6 w-6', className)} />;

  return (
    <button
      type="button"
      onClick={() => {
        if (favorited) removeFavorite(id, type);
        else addFavorite(id, type, name);
      }}
      className={cn(
        'rounded p-1 transition-colors',
        favorited ? 'text-accent' : 'text-muted hover:text-heading',
        className
      )}
      aria-label={favorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
    >
      <svg
        className="h-5 w-5"
        fill={favorited ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    </button>
  );
}
