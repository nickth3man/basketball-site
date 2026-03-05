/**
 * @fileoverview Typed route builders for dynamic segments.
 *
 * Provides type-safe route generation that satisfies Next.js typedRoutes
 * while producing clean canonical URLs (no query params).
 *
 * Usage:
 *   <Link href={routes.boxscore(gameId)}>Box Score</Link>
 *   <Link href={routes.player(letter, id)}>{name}</Link>
 *
 * @module @/lib/routes
 */

import type { Route } from 'next';

/**
 * Type-safe route builders for all dynamic routes in the app.
 *
 * All functions return `Route` type which satisfies typedRoutes checking,
 * while producing clean URLs like `/players/j/jamesle01` instead of
 * query-param-based URLs.
 */
export const routes = {
  // Box scores
  boxscore: (gameId: string): Route => `/boxscores/${gameId}` as Route,

  // Players (nested: /players/[letter]/[id])
  player: (letter: string, id: string): Route => `/players/${letter.toLowerCase()}/${id}` as Route,

  // Player letter index (e.g., /players/j/)
  playerLetter: (letter: string): Route => `/players/${letter.toLowerCase()}` as Route,

  // Teams
  team: (abbrev: string): Route => `/teams/${abbrev.toUpperCase()}` as Route,
  teamSeason: (abbrev: string, season: string | number): Route =>
    `/teams/${abbrev.toUpperCase()}/${season}` as Route,

  // Leagues
  league: (leagueSeason: string): Route => `/leagues/${leagueSeason}` as Route,

  // Draft
  draft: (year: string | number): Route => `/draft/${year}` as Route,

  // Games
  game: (gameId: string): Route => `/games/${gameId}` as Route,
} as const;
