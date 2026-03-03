import Database from "better-sqlite3";
import path from "node:path";

let db: Database.Database | null = null;

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const MAX_QUERY_CACHE_SIZE = 500;

const queryResultCache = new Map<string, CacheEntry>();

function buildQueryCacheKey(sql: string, params: unknown[]): string {
  return `${sql}::${JSON.stringify(params)}`;
}

function cleanupExpiredCacheEntries(): void {
  const now = Date.now();
  for (const [key, entry] of queryResultCache) {
    if (entry.expiresAt <= now) {
      queryResultCache.delete(key);
    }
  }
}

function readCachedResult<T>(key: string): T | undefined {
  const entry = queryResultCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    queryResultCache.delete(key);
    return undefined;
  }

  // touch entry to implement simple LRU behavior with Map iteration order
  queryResultCache.delete(key);
  queryResultCache.set(key, entry);

  return entry.value as T;
}

function evictLeastRecentlyUsedEntryIfNeeded(): void {
  if (queryResultCache.size <= MAX_QUERY_CACHE_SIZE) {
    return;
  }
  // Evict the oldest entry (first inserted / least recently used due to re-insertion on access)
  const firstKey = queryResultCache.keys().next().value as string | undefined;
  if (firstKey !== undefined) {
    queryResultCache.delete(firstKey);
  }
}

function writeCachedResult<T>(key: string, value: T, ttlMs: number): T {
  // opportunistic cleanup of expired entries to keep map from growing with dead keys
  cleanupExpiredCacheEntries();

  queryResultCache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value,
  });

  // enforce a max size to keep memory usage bounded
  evictLeastRecentlyUsedEntryIfNeeded();

  return value;
}

function patchPrepareWithCache(database: Database.Database): void {
  const originalPrepare = database.prepare.bind(database);

  const wrappedPrepare: Database.Database["prepare"] = ((sql: string) => {
    const statement = originalPrepare(sql);
    const originalGet = statement.get.bind(statement);
    const originalAll = statement.all.bind(statement);

    statement.get = ((...params: unknown[]) => {
      const key = `stmt:get:${buildQueryCacheKey(sql, params)}`;
      const cached = readCachedResult<unknown>(key);
      if (cached !== undefined) return cached;

      return writeCachedResult(key, originalGet(...params), 30_000);
    }) as typeof statement.get;

    statement.all = ((...params: unknown[]) => {
      const key = `stmt:all:${buildQueryCacheKey(sql, params)}`;
      const cached = readCachedResult<unknown>(key);
      if (cached !== undefined) return cached;

      return writeCachedResult(key, originalAll(...params), 30_000);
    }) as typeof statement.all;

    return statement;
  }) as Database.Database["prepare"];

  database.prepare = wrappedPrepare;
}

function dbPath(): string {
  const envPath = process.env.DB_PATH;
  if (envPath) return envPath;
  return path.join(process.cwd(), "nba_raw_data.db");
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath(), { readonly: true });
    patchPrepareWithCache(db);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }

  return db;
}

export function getCachedQueryOne<T>(sql: string, params: unknown[], ttlMs = 30_000): T {
  const key = `one:${buildQueryCacheKey(sql, params)}`;
  const cached = readCachedResult<T>(key);
  if (cached !== undefined) return cached;

  const result = getDb().prepare(sql).get(...params) as T;
  return writeCachedResult(key, result, ttlMs);
}

export function getCachedQueryMany<T>(sql: string, params: unknown[], ttlMs = 30_000): T {
  const key = `many:${buildQueryCacheKey(sql, params)}`;
  const cached = readCachedResult<T>(key);
  if (cached !== undefined) return cached;

  const result = getDb().prepare(sql).all(...params) as T;
  return writeCachedResult(key, result, ttlMs);
}

export function getLatestSeasonId(): string {
  const row = getDb()
    .prepare("SELECT season_id FROM dim_season ORDER BY start_year DESC LIMIT 1")
    .get() as { season_id: string } | undefined;

  return row?.season_id ?? "2025-26";
}
