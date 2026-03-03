/**
 * Query Module Index
 *
 * Re-exports all domain query modules for backward compatibility.
 * This allows existing imports from "@/lib/queries" to continue working.
 */

// Domain modules
export * from './players';
export * from './teams';
export * from './games';
export * from './seasons';

// Re-export feature queries for convenience
export { getHomeStandings, getRecentGames } from '../query/home';
export { searchEntities } from '../query/search';
export { getPlayerDirectory, getTeamDirectory } from '../query/directory';
