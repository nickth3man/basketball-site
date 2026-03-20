import {
  getPlayerAdjustedShootingStats,
  getPlayerAdvancedSeasonStats,
  getPlayerAwards,
  getPlayerByBrefId,
  getPlayerCareerSummary,
  getPlayerFullGameLog,
  getPlayerGameHighs,
  getPlayerPer100Stats,
  getPlayerPer36Stats,
  getPlayerPerGameStats,
  getPlayerPbpSeasonStats,
  getPlayerSalaries,
  getPlayerSeasonStats,
  getPlayerShootingSeasonStats,
} from '@/lib/queries';

type DbRecord = Record<string, string | number | null>;

function aggregateAwards(awards: Array<{ award_name: string }>): Array<[string, number]> {
  const counts = awards.reduce<Record<string, number>>((acc, award) => {
    acc[award.award_name] = (acc[award.award_name] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 8);
}

export interface PlayerPageData {
  adjustedShootingStats: DbRecord[];
  advancedStats: DbRecord[];
  awardCounts: Array<[string, number]>;
  awards: Array<{ award_name: string; [key: string]: string | number | null }>;
  fullGameLog: DbRecord[];
  highs: Record<string, number | null>;
  pbpStats: DbRecord[];
  per100Stats: DbRecord[];
  per36Stats: DbRecord[];
  perGameStats: DbRecord[];
  player: ReturnType<typeof getPlayerByBrefId>;
  salaries: DbRecord[];
  seasonStats: DbRecord[];
  shootingStats: DbRecord[];
  summary: ReturnType<typeof getPlayerCareerSummary>;
}

export function getPlayerPageData(brefId: string): PlayerPageData | undefined {
  const player = getPlayerByBrefId(brefId);
  if (player == null) {
    return undefined;
  }

  const perGameStats = getPlayerPerGameStats(brefId, 25);
  const per36Stats = getPlayerPer36Stats(brefId, 25);
  const per100Stats = getPlayerPer100Stats(brefId, 25);
  const seasonStats = getPlayerSeasonStats(brefId, 25);
  const advancedStats = getPlayerAdvancedSeasonStats(brefId, 25);
  const shootingStats = getPlayerShootingSeasonStats(brefId, 25);
  const adjustedShootingStats = getPlayerAdjustedShootingStats(brefId, 25);
  const pbpStats = getPlayerPbpSeasonStats(brefId, 25);
  const fullGameLog = getPlayerFullGameLog(player.player_id, 100);
  const awards = getPlayerAwards(player.player_id, 100);
  const salaries = getPlayerSalaries(player.player_id, 30);
  const summary = getPlayerCareerSummary(brefId);
  const highs = getPlayerGameHighs(player.player_id);

  return {
    adjustedShootingStats,
    advancedStats,
    awardCounts: aggregateAwards(awards),
    awards,
    fullGameLog,
    highs,
    pbpStats,
    per100Stats,
    per36Stats,
    perGameStats,
    player,
    salaries,
    seasonStats,
    shootingStats,
    summary,
  };
}
