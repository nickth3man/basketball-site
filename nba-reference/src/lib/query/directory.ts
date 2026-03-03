import { getCachedQueryMany } from "@/lib/db";

export type PlayerDirectoryRow = {
  bref_id: string;
  full_name: string;
  position: string | null;
  is_active: number;
};

export type TeamDirectoryRow = {
  abbreviation: string;
  full_name: string;
  conference: string | null;
  division: string | null;
};

export function getPlayerDirectory(limit = 400): PlayerDirectoryRow[] {
  return getCachedQueryMany<PlayerDirectoryRow[]>(
    `SELECT bref_id, full_name, position, is_active
     FROM dim_player
     WHERE bref_id IS NOT NULL
     ORDER BY is_active DESC, full_name ASC
     LIMIT ?`,
    [limit],
    60_000,
  );
}

export function getTeamDirectory(): TeamDirectoryRow[] {
  return getCachedQueryMany<TeamDirectoryRow[]>(
    `SELECT abbreviation, full_name, conference, division
     FROM dim_team
     ORDER BY full_name ASC`,
    [],
    60_000,
  );
}
