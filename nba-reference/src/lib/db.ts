import Database from "better-sqlite3";
import path from "node:path";

let db: Database.Database | null = null;

function dbPath(): string {
  const envPath = process.env.DB_PATH;
  if (envPath) return envPath;
  return path.join(process.cwd(), "nba_raw_data.db");
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath(), { readonly: true });
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }

  return db;
}

export type TeamStandingRow = {
  season_id: string;
  bref_abbrev: string;
  w: number | null;
  l: number | null;
  n_rtg: number | null;
  pace: number | null;
};

export type RecentGameRow = {
  game_id: string;
  game_date: string;
  home_abbrev: string;
  away_abbrev: string;
  home_score: number | null;
  away_score: number | null;
};

export type PlayerDirectoryRow = {
  bref_id: string;
  full_name: string;
  position: string | null;
  is_active: number;
};

export function getLatestSeasonId(): string {
  const row = getDb()
    .prepare("SELECT season_id FROM dim_season ORDER BY start_year DESC LIMIT 1")
    .get() as { season_id: string } | undefined;

  return row?.season_id ?? "2025-26";
}

export function getHomeStandings(limit = 15): TeamStandingRow[] {
  const latestWithTeamData = getDb()
    .prepare("SELECT season_id FROM fact_team_season ORDER BY season_id DESC LIMIT 1")
    .get() as { season_id: string } | undefined;
  const seasonId = latestWithTeamData?.season_id ?? getLatestSeasonId();

  return getDb()
    .prepare(
      `SELECT season_id, bref_abbrev, w, l, n_rtg, pace
       FROM fact_team_season
       WHERE season_id = ?
       ORDER BY w DESC, l ASC
       LIMIT ?`,
    )
    .all(seasonId, limit) as TeamStandingRow[];
}

export function getRecentGames(limit = 12): RecentGameRow[] {
  return getDb()
    .prepare(
      `SELECT g.game_id, g.game_date,
              ht.abbreviation as home_abbrev,
              at.abbreviation as away_abbrev,
              g.home_score, g.away_score
       FROM fact_game g
       JOIN dim_team ht ON ht.team_id = g.home_team_id
       JOIN dim_team at ON at.team_id = g.away_team_id
       WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL
       ORDER BY g.game_date DESC
       LIMIT ?`,
    )
    .all(limit) as RecentGameRow[];
}

export function searchEntities(query: string): Array<{
  type: "player" | "team";
  id: string;
  label: string;
}> {
  const q = `%${query.toLowerCase()}%`;
  const players = getDb()
    .prepare(
      `SELECT 'player' as type, bref_id as id, full_name as label
       FROM dim_player
       WHERE bref_id IS NOT NULL AND LOWER(full_name) LIKE ?
       LIMIT 10`,
    )
    .all(q) as Array<{ type: "player"; id: string; label: string }>;

  const teams = getDb()
    .prepare(
      `SELECT 'team' as type, abbreviation as id, full_name as label
       FROM dim_team
       WHERE LOWER(full_name) LIKE ? OR LOWER(abbreviation) LIKE ?
       LIMIT 10`,
    )
    .all(q, q) as Array<{ type: "team"; id: string; label: string }>;

  return [...players, ...teams].slice(0, 12);
}
