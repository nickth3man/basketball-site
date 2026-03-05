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
export * from './leaders';
export * from './draft';
export * from './playoffs';
export * from './awards';
export * from './allstar';
export * from './standings';
export * from './team-schedule';
export * from './player-splits';
export * from './franchise';
export * from './frivolities';

// Re-export feature queries for convenience
export { getHomeStandings, getRecentGames } from '../query/home';
export { searchEntities } from '../query/search';
export { getPlayerDirectory, getPlayerDirectoryByLetter, getTeamDirectory } from '../query/directory';
