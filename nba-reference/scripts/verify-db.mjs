import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

function resolveDbPath() {
  const envPath = process.env.DB_PATH;
  if (typeof envPath === 'string' && envPath.trim().length > 0) {
    return envPath;
  }

  return path.resolve(process.cwd(), '../db/nba_raw_data.db');
}

const dbPath = resolveDbPath();

if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found: ${dbPath}`);
  process.exit(1);
}

const stats = fs.statSync(dbPath);
if (stats.size === 0) {
  console.error(`Database file is empty: ${dbPath}`);
  process.exit(1);
}

let db;

try {
  db = new Database(dbPath, { readonly: true });
  const row = db
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table'
       ORDER BY name ASC
       LIMIT 1`
    )
    .get();

  if (row == null || typeof row.name !== 'string' || row.name.length === 0) {
    throw new Error('No readable tables were found in the SQLite payload.');
  }

  console.log(`Verified SQLite payload at ${dbPath}`);
  console.log(`First readable table: ${row.name}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Database verification failed: ${message}`);
  process.exit(1);
} finally {
  db?.close();
}
