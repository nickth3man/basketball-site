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
export * from './salaries';
export * from './compare';

// Re-export feature queries for convenience
export {
  getLatestCompletedGameDate,
  getPreviousCompletedGameDate,
  getNextCompletedGameDate,
  getCompletedGamesByDate,
  getHomeSeasonId,
  getHomeStandings,
  getRecentGames,
  getPlayerDirectory,
  getPlayerDirectoryByLetter,
  getTeamDirectory,
  getSearchTypeLabel,
  SEARCH_RESULT_TYPES,
  searchEntities,
} from '../query';
export type { SearchEntitiesOptions, SearchEntityResult, SearchResultType } from '../query';
