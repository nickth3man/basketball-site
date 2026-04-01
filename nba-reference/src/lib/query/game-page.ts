import { cache } from 'react';
import {
  getGameById,
  getGameLineScore,
  getGamePbpEvents,
  getGamePbpWithShotDetails,
  getGamePlayerAdvancedBoxScore,
  getGamePlayerBoxScore,
  getGameTeamBoxScores,
  getGameTeamFourFactors,
} from '@/lib/queries';
import type { ShotEvent } from '@/lib/queries/games';

type DbRecord = Record<string, string | number | null>;

export interface GamePageData {
  awayAdvanced: DbRecord[];
  awayPlayers: DbRecord[];
  awayTeam: string;
  box: DbRecord[];
  fourFactors: Array<Record<string, string | number | null>>;
  game: ReturnType<typeof getGameById>;
  homeAdvanced: DbRecord[];
  homePlayers: DbRecord[];
  homeTeam: string;
  lineScore: DbRecord[];
  pbp: DbRecord[];
  playerAdvanced: DbRecord[];
  players: DbRecord[];
  shotDetails: ShotEvent[];
}

export const getGamePageData = cache((gameId: string, pbpLimit = 250): GamePageData | undefined => {
  const game = getGameById(gameId);
  if (game == null) {
    return undefined;
  }

  const box = getGameTeamBoxScores(gameId);
  const players = getGamePlayerBoxScore(gameId);
  const playerAdvanced = getGamePlayerAdvancedBoxScore(gameId);
  const lineScore = getGameLineScore(gameId);
  const fourFactors = getGameTeamFourFactors(gameId);
  const pbp = getGamePbpEvents(gameId, pbpLimit);
  const shotDetails = getGamePbpWithShotDetails(gameId);
  const awayTeam = String(game['away_abbrev'] ?? '');
  const homeTeam = String(game['home_abbrev'] ?? '');
  const awayPlayers = players.filter(player => String(player['team']) === awayTeam);
  const homePlayers = players.filter(player => String(player['team']) === homeTeam);
  const awayAdvanced = playerAdvanced.filter(player => String(player['team']) === awayTeam);
  const homeAdvanced = playerAdvanced.filter(player => String(player['team']) === homeTeam);

  return {
    awayAdvanced,
    awayPlayers,
    awayTeam,
    box,
    fourFactors,
    game,
    homeAdvanced,
    homePlayers,
    homeTeam,
    lineScore,
    pbp,
    playerAdvanced,
    players,
    shotDetails,
  };
});
