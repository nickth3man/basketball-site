/**
 * @fileoverview One-time setup script to create analytics tables for lineups and on/off analysis.
 *
 * This script must be run before the application starts if the analytics tables
 * do not yet exist in the database. It creates:
 * - fact_lineup_aggregation: 5-player lineup units with net/off/def ratings (populated by ETL)
 * - fact_on_off: Per-player on/off net rating analysis (populated from fact_player_pbp_season)
 *
 * Usage:
 *   node scripts/setup-analytics-tables.mjs
 *
 * The database is treated as a published artifact from the ETL pipeline.
 * This script only creates tables/populates derived data; it never deletes existing data.
 */

import Database from 'better-sqlite3';
import path from 'node:path';

function resolveDbPath() {
  const envPath = process.env.DB_PATH;
  if (typeof envPath === 'string' && envPath.trim().length > 0) {
    return envPath;
  }
  return path.resolve(process.cwd(), '../db/nba_raw_data.db');
}

const dbPath = resolveDbPath();
console.log(`Opening database at: ${dbPath}`);

const db = new Database(dbPath); // writable — this script runs outside app context
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// ---------------------------------------------------------------------------
// fact_lineup_aggregation
// Stores aggregated 5-player lineup performance. Populated by the ETL pipeline.
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS fact_lineup_aggregation (
    lineup_id      INTEGER PRIMARY KEY,
    team_id        TEXT    NOT NULL REFERENCES dim_team(team_id),
    season_id      TEXT    NOT NULL REFERENCES dim_season(season_id),
    player_ids     TEXT    NOT NULL,  -- JSON array of bref_player_ids
    minutes        REAL,
    possessions    INTEGER,
    points_scored  INTEGER,
    points_allowed INTEGER,
    net_rating     REAL,
    off_rating     REAL,
    def_rating     REAL,
    UNIQUE (team_id, season_id, player_ids)
  ) STRICT;

  CREATE INDEX IF NOT EXISTS idx_lineup_team_season
    ON fact_lineup_aggregation(team_id, season_id);
`);
console.log('fact_lineup_aggregation table ready.');

// ---------------------------------------------------------------------------
// fact_on_off
// Derived from fact_player_pbp_season. Stores per-player on/off net rating.
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS fact_on_off (
    id                INTEGER PRIMARY KEY,
    bref_player_id    TEXT    NOT NULL,
    team_id           TEXT    NOT NULL REFERENCES dim_team(team_id),
    season_id         TEXT    NOT NULL REFERENCES dim_season(season_id),
    on_court_minutes  INTEGER,
    on_net_rating     REAL,
    off_net_rating    REAL,
    net_impact        REAL,
    UNIQUE (bref_player_id, team_id, season_id)
  ) STRICT;

  CREATE INDEX IF NOT EXISTS idx_on_off_team_season
    ON fact_on_off(team_id, season_id);
`);
console.log('fact_on_off table ready.');

// ---------------------------------------------------------------------------
// Populate fact_on_off from fact_player_pbp_season
// on_net_rating  = on_court_pm_per100
// net_impact     = net_pm_per100  (on − off)
// off_net_rating = on_court_pm_per100 − net_pm_per100
// ---------------------------------------------------------------------------
const insertOnOff = db.prepare(`
  INSERT OR REPLACE INTO fact_on_off
    (bref_player_id, team_id, season_id, on_court_minutes, on_net_rating, off_net_rating, net_impact)
  SELECT
    pbp.bref_player_id,
    dt.team_id,
    pbp.season_id,
    pbp.mp,
    pbp.on_court_pm_per100,
    ROUND(pbp.on_court_pm_per100 - pbp.net_pm_per100, 1),
    pbp.net_pm_per100
  FROM fact_player_pbp_season pbp
  JOIN dim_team dt
    ON (pbp.team_abbrev = dt.abbreviation OR pbp.team_abbrev = dt.bref_abbrev)
  WHERE pbp.on_court_pm_per100 IS NOT NULL
    AND pbp.net_pm_per100     IS NOT NULL
`);

const result = insertOnOff.run();
console.log(`fact_on_off populated: ${result.changes} rows upserted.`);

db.close();
console.log('Analytics tables setup complete.');
