/**
 * @fileoverview Database module providing a singleton SQLite connection with automatic caching.
 * 
 * This module implements a database access layer with the following features:
 * - Singleton pattern for database connection management
 * - Automatic query result caching with configurable TTL (30s default)
 * - LRU (Least Recently Used) cache eviction when size limit is reached
 * - Read-only database access (WAL mode enabled for better concurrency)
 * - Environment-based database path configuration
 * 
 * @module @/lib/db
 */

import Database from "better-sqlite3";
import path from "node:path";

/** Singleton database instance - initialized on first access */
let db: Database.Database | null = null;

/**
 * Cache entry structure for query results.
 * Uses expiration timestamp for TTL-based invalidation.
 */
type CacheEntry = {
  /** Unix timestamp (ms) when this entry expires */
  expiresAt: number;
  /** Cached query result value */
  value: unknown;
};

/** Maximum number of cached query results to prevent unbounded memory growth */
const MAX_QUERY_CACHE_SIZE = 500;

/**
 * Runtime options for statement-level cache patching.
 */
type PreparePatchOptions = {
  /**
   * Whether the database connection is read-only.
   * Statement-level caching is disabled when false to avoid stale reads after mutations.
   */
  readonly: boolean;
};

/** 
 * In-memory cache for query results.
 * Map iteration order is used to implement simple LRU behavior.
 */
const queryResultCache = new Map<string, CacheEntry>();

/**
 * Builds a unique cache key from SQL query and parameters.
 * Uses JSON serialization for parameter comparison.
 * 
 * @param sql - The SQL query string
 * @param params - Array of query parameters
 * @returns Unique cache key string
 */
function buildQueryCacheKey(sql: string, params: unknown[]): string {
  return `${sql}::${JSON.stringify(params)}`;
}

/**
 * Removes all expired entries from the cache.
 * Called opportunistically during write operations to prevent memory leaks.
 */
function cleanupExpiredCacheEntries(): void {
  const now = Date.now();
  for (const [key, entry] of queryResultCache) {
    if (entry.expiresAt <= now) {
      queryResultCache.delete(key);
    }
  }
}

/**
 * Retrieves a cached result if it exists and hasn't expired.
 * Implements LRU behavior by moving accessed entries to the end of the Map.
 * 
 * @param key - Cache key to look up
 * @returns Cached value or undefined if not found/expired
 * @typeParam T - Expected return type
 */
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

/**
 * Evicts the least recently used entry if cache size exceeds limit.
 * LRU entry is always at the beginning of the Map (first key).
 */
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

/**
 * Stores a query result in the cache with TTL expiration.
 * Also triggers cleanup of expired entries and LRU eviction if needed.
 * 
 * @param key - Cache key for this entry
 * @param value - Query result to cache
 * @param ttlMs - Time-to-live in milliseconds
 * @returns The cached value (for convenient chaining)
 * @typeParam T - Type of the cached value
 */
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

/**
 * Strips leading SQL comments and whitespace from a query string.
 *
 * Supports repeated leading:
 * - line comments: `-- comment`
 * - block comments: `/* comment *\/`
 *
 * @param sql - Raw SQL query string
 * @returns SQL query with leading comments/whitespace removed
 */
function stripLeadingSqlComments(sql: string): string {
  let remaining = sql;

  while (true) {
    const trimmedStart = remaining.trimStart();
    remaining = trimmedStart;

    // Nothing meaningful left.
    if (remaining.length === 0) {
      return remaining;
    }

    // Consume leading line comment.
    if (remaining.startsWith("--")) {
      const newlineIndex = remaining.indexOf("\n");
      remaining = newlineIndex === -1 ? "" : remaining.slice(newlineIndex + 1);
      continue;
    }

    // Consume leading block comment.
    if (remaining.startsWith("/*")) {
      const endIndex = remaining.indexOf("*/", 2);
      remaining = endIndex === -1 ? "" : remaining.slice(endIndex + 2);
      continue;
    }

    // No more leading comments to consume.
    return remaining;
  }
}

/**
 * Determines whether a SQL query is safe for read-result caching.
 *
 * Guardrail policy:
 * - Cache only queries whose first token is SELECT
 * - Do not cache other statements (INSERT/UPDATE/DELETE/PRAGMA/etc.)
 *
 * This intentionally conservative check avoids stale read issues for future
 * write-enabled database usage.
 *
 * @param sql - SQL query string
 * @returns True when query is cacheable as read-only SELECT
 */
function isCacheableReadQuery(sql: string): boolean {
  const normalized = stripLeadingSqlComments(sql).toUpperCase();
  return normalized.startsWith("SELECT");
}

/**
 * Monkey-patches the Database.prepare() method to add automatic caching.
 * Wraps statement.get() and statement.all() with cache lookups.
 * 
 * Safety constraints:
 * - Patch is active only for read-only database connections
 * - Even in read-only mode, only statements beginning with SELECT are cached
 * - Non-SELECT statements bypass cache wrappers entirely
 *
 * This keeps current behavior efficient while reducing stale-read risk if
 * write support is introduced in the future.
 *
 * Cache keys are prefixed with operation type to avoid collisions:
 * - "stmt:get:" for single row queries
 * - "stmt:all:" for multi-row queries
 * 
 * @param database - better-sqlite3 Database instance to patch
 * @param options - Patch behavior options including readonly guard
 */
function patchPrepareWithCache(
  database: Database.Database,
  options: PreparePatchOptions,
): void {
  // Never patch statement methods in writable mode.
  if (!options.readonly) {
    return;
  }

  const originalPrepare = database.prepare.bind(database);

  const wrappedPrepare: Database.Database["prepare"] = ((sql: string) => {
    const statement = originalPrepare(sql);

    // Cache only explicit SELECT statements.
    if (!isCacheableReadQuery(sql)) {
      return statement;
    }

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

/**
 * Determines the database file path.
 * Uses DB_PATH environment variable if set, otherwise defaults to
 * "nba_raw_data.db" in the current working directory.
 * 
 * @returns Absolute path to the SQLite database file
 */
function dbPath(): string {
  const envPath = process.env.DB_PATH;
  if (envPath) return envPath;
  return path.join(process.cwd(), "nba_raw_data.db");
}

/**
 * Returns the singleton database instance, initializing it if necessary.
 * 
 * Configuration applied on initialization:
 * - Read-only mode (no mutations allowed)
 * - WAL (Write-Ahead Logging) mode for better read concurrency
 * - Foreign key constraints enabled
 * - Automatic query caching via patchPrepareWithCache()
 * 
 * @returns Database instance with caching enabled
 */
export function getDb(): Database.Database {
  if (!db) {
    const readonly = true;
    db = new Database(dbPath(), { readonly });
    patchPrepareWithCache(db, { readonly });
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }

  return db;
}

/**
 * Executes a single-row query with caching.
 * 
 * @param sql - SQL query string with placeholders
 * @param params - Array of parameter values
 * @param ttlMs - Cache TTL in milliseconds (default: 30s)
 * @returns Single row result or undefined
 * @typeParam T - Expected row type
 * @example
 * ```ts
 * const row = getCachedQueryOne<{ id: string; name: string }>(
 *   "SELECT id, name FROM users WHERE id = ?",
 *   [userId],
 *   60_000
 * );
 * ```
 */
export function getCachedQueryOne<T>(
  sql: string,
  params: unknown[],
  ttlMs = 30_000,
): T {
  const key = `one:${buildQueryCacheKey(sql, params)}`;
  const cached = readCachedResult<T>(key);
  if (cached !== undefined) return cached;

  const result = getDb()
    .prepare(sql)
    .get(...params) as T;
  return writeCachedResult(key, result, ttlMs);
}

/**
 * Executes a multi-row query with caching.
 * 
 * @param sql - SQL query string with placeholders
 * @param params - Array of parameter values
 * @param ttlMs - Cache TTL in milliseconds (default: 30s)
 * @returns Array of row results
 * @typeParam T - Expected row type
 * @example
 * ```ts
 * const rows = getCachedQueryMany<Array<{ id: string }>>(
 *   "SELECT id FROM users WHERE active = ?",
 *   [1],
 *   60_000
 * );
 * ```
 */
export function getCachedQueryMany<T>(
  sql: string,
  params: unknown[],
  ttlMs = 30_000,
): T {
  const key = `many:${buildQueryCacheKey(sql, params)}`;
  const cached = readCachedResult<T>(key);
  if (cached !== undefined) return cached;

  const result = getDb()
    .prepare(sql)
    .all(...params) as T;
  return writeCachedResult(key, result, ttlMs);
}

/**
 * Returns the most recent season ID from the database.
 * Falls back to "2025-26" if no seasons are found.
 * 
 * Used throughout the app as a default season filter.
 * 
 * @returns Season ID string (e.g., "2024-25")
 */
export function getLatestSeasonId(): string {
  const row = getDb()
    .prepare(
      "SELECT season_id FROM dim_season ORDER BY start_year DESC LIMIT 1",
    )
    .get() as { season_id: string } | undefined;

  return row?.season_id ?? "2025-26";
}
