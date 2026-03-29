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
    <section className="mb-6 surface-altar">
      <h2 className="mb-4 inscription-title text-lg">Your Favorites</h2>
      {players.length > 0 ? (
        <div className="mb-6">
          <h3 className="mb-3 editorial-kicker">Players</h3>
          <div className="flex flex-wrap gap-2">
            {players.map(player => (
              <Link
                key={player.id}
                href={routes.player(player.id.slice(0, 1).toLowerCase(), player.id)}
                className="stat-coin ambient-glow-hover hover:brightness-105"
              >
                {player.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {teams.length > 0 ? (
        <div>
          <h3 className="mb-3 editorial-kicker">Teams</h3>
          <div className="flex flex-wrap gap-2">
            {teams.map(team => (
              <Link
                key={team.id}
                href={routes.team(team.id)}
                className="stat-coin ambient-glow-hover hover:brightness-105"
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
