'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useFavorites } from '@/hooks/use-favorites';
import { routes } from '@/lib/routes';

export function FavoritesWidget(): JSX.Element | null {
  const { favorites, isLoaded } = useFavorites();

  if (!isLoaded || favorites.length === 0) return null;

  const players = favorites.filter(f => f.type === 'player').slice(0, 5);
  const teams = favorites.filter(f => f.type === 'team').slice(0, 5);

  return (
    <section className="mb-6 rounded-lg border border-line bg-paper p-4">
      <h2 className="mb-3 text-lg font-bold text-heading">Your Favorites</h2>
      {players.length > 0 ? (
        <div className="mb-3">
          <h3 className="mb-2 text-sm font-medium text-muted">Players</h3>
          <div className="flex flex-wrap gap-2">
            {players.map(player => (
              <Link
                key={player.id}
                href={routes.player(player.id.slice(0, 1).toLowerCase(), player.id)}
                className="rounded-full bg-paper-soft px-3 py-1 text-sm text-heading transition-colors hover:bg-accent/10"
              >
                {player.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {teams.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted">Teams</h3>
          <div className="flex flex-wrap gap-2">
            {teams.map(team => (
              <Link
                key={team.id}
                href={routes.team(team.id)}
                className="rounded-full bg-paper-soft px-3 py-1 text-sm text-heading transition-colors hover:bg-accent/10"
              >
                {team.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
