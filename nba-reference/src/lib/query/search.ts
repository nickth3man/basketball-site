import { getCachedQueryMany } from "@/lib/db";

export type SearchEntityResult = {
  type: "player" | "team";
  id: string;
  label: string;
};

export function searchEntities(query: string): SearchEntityResult[] {
  const q = `%${query.toLowerCase()}%`;
  const players = getCachedQueryMany<Array<{ type: "player"; id: string; label: string }>>(
    `SELECT 'player' as type, bref_id as id, full_name as label
     FROM dim_player
     WHERE bref_id IS NOT NULL AND LOWER(full_name) LIKE ?
     LIMIT 10`,
    [q],
    5_000,
  );

  const teams = getCachedQueryMany<Array<{ type: "team"; id: string; label: string }>>(
    `SELECT 'team' as type, abbreviation as id, full_name as label
     FROM dim_team
     WHERE LOWER(full_name) LIKE ? OR LOWER(abbreviation) LIKE ?
     LIMIT 10`,
    [q, q],
    5_000,
  );

  return [...players, ...teams].slice(0, 12);
}
