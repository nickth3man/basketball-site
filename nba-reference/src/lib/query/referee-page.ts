import { cache } from 'react';
import { getRefereeById, getRefereeCareerStats, getRefereeSeasonStats } from '@/lib/queries';

type DbRecord = Record<string, string | number | null>;

export interface RefereePageData {
  referee: ReturnType<typeof getRefereeById>;
  careerStats: ReturnType<typeof getRefereeCareerStats>;
  seasonStats: DbRecord[];
}

export const getRefereePageData = cache(
  (refereeId: string | number): RefereePageData | undefined => {
    const referee = getRefereeById(refereeId);
    if (referee == null) return undefined;

    const careerStats = getRefereeCareerStats(refereeId);
    const seasonStats = getRefereeSeasonStats(refereeId);

    return { referee, careerStats, seasonStats };
  }
);
