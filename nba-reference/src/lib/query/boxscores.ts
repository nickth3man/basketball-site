import { getCachedQueryMany, getCachedQueryOne } from '@/lib/db';

export interface BoxscoreGameRow {
  game_id: string;
  game_date: string;
  home_abbrev: string;
  away_abbrev: string;
  home_score: number | null;
  away_score: number | null;
}

export function getLatestCompletedGameDate(): string | null {
  const row = getCachedQueryOne<{ game_date: string } | undefined>(
    `SELECT game_date
     FROM fact_game
     WHERE home_score IS NOT NULL
       AND away_score IS NOT NULL
     ORDER BY game_date DESC
     LIMIT 1`,
    [],
    15_000
  );

  return row?.game_date ?? null;
}

export function getPreviousCompletedGameDate(gameDate: string): string | null {
  const row = getCachedQueryOne<{ game_date: string } | undefined>(
    `SELECT game_date
     FROM fact_game
     WHERE home_score IS NOT NULL
       AND away_score IS NOT NULL
       AND game_date < ?
     GROUP BY game_date
     ORDER BY game_date DESC
     LIMIT 1`,
    [gameDate],
    15_000
  );

  return row?.game_date ?? null;
}

export function getNextCompletedGameDate(gameDate: string): string | null {
  const row = getCachedQueryOne<{ game_date: string } | undefined>(
    `SELECT game_date
     FROM fact_game
     WHERE home_score IS NOT NULL
       AND away_score IS NOT NULL
       AND game_date > ?
     GROUP BY game_date
     ORDER BY game_date ASC
     LIMIT 1`,
    [gameDate],
    15_000
  );

  return row?.game_date ?? null;
}

export function getCompletedGamesByDate(gameDate: string): BoxscoreGameRow[] {
  return getCachedQueryMany<BoxscoreGameRow[]>(
    `SELECT g.game_id,
            g.game_date,
            ht.abbreviation AS home_abbrev,
            at.abbreviation AS away_abbrev,
            g.home_score,
            g.away_score
     FROM fact_game g
     JOIN dim_team ht ON ht.team_id = g.home_team_id
     JOIN dim_team at ON at.team_id = g.away_team_id
     WHERE g.game_date = ?
       AND g.home_score IS NOT NULL
       AND g.away_score IS NOT NULL
     ORDER BY g.game_id ASC`,
    [gameDate],
    15_000
  );
}
