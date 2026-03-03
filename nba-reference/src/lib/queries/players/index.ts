/**
 * @fileoverview Player queries index - re-exports all player query modules.
 *
 * This module provides a unified interface to all player-related query functions,
 * organized by domain (profile, season-stats, advanced, career, games).
 *
 * @module @/lib/queries/players
 */

// Profile queries - basic player information
export { getPlayerByBrefId } from './profile';

// Season statistics queries - per-game, per-36, per-100, totals
export {
  getPlayerSeasonStats,
  getPlayerPer36Stats,
  getPlayerPer100Stats,
  getPlayerPerGameStats,
} from './season-stats';

// Advanced statistics queries - PER, VORP, WS, shooting, PBP
export {
  getPlayerAdvancedSeasonStats,
  getPlayerShootingSeasonStats,
  getPlayerAdjustedShootingStats,
  getPlayerPbpSeasonStats,
} from './advanced';

// Career statistics queries - totals, highs, awards, salaries
export {
  getPlayerCareerSummary,
  getPlayerCareerTotals,
  getPlayerGameHighs,
  getPlayerAwards,
  getPlayerSalaries,
} from './career';

// Game queries - recent games, full game log, vs opponent
export { getPlayerRecentGames, getPlayerFullGameLog, getPlayerVsOpponentStats } from './games';
