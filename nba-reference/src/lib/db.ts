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

import Database from 'better-sqlite3';
import path from 'node:path';

/** Singleton database instance - initialized on first access */
let db: Database.Database | null = null;

/**
 * Cache entry structure for query results.
 * Uses expiration timestamp for TTL-based invalidation.
 */
interface CacheEntry {
  /** Unix timestamp (ms) when this entry expires */
  expiresAt: number;
  /** Cached query result value */
  value: unknown;
}

/** Maximum number of cached query results to prevent unbounded memory growth */
const MAX_QUERY_CACHE_SIZE = 500;

/**
 * Runtime options for statement-level cache patching.
 */
interface PreparePatchOptions {
  /**
   * Whether the database connection is read-only.
   * Statement-level caching is disabled when false to avoid stale reads after mutations.
   */
  readonly: boolean;
}

/**
 * In-memory cache for query results.
 * Map iteration order is used to implement simple LRU behavior.
 */
const queryResultCache = new Map<string, CacheEntry>();

/**
 * Create a stable cache key for a SQL query and its parameters.
 *
 * The key is formed by concatenating the SQL string, "::", and the JSON-serialized `params`.
 *
 * @param sql - The SQL query string to include in the key
 * @param params - Ordered array of query parameters; values are JSON-serialized
 * @returns The combined cache key string
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
 * Return the cached value for `key` if present and not expired; marks the entry as recently used.
 *
 * @param key - Cache key to look up
 * @typeParam T - Expected return type
 * @returns The cached value for `key`, or `undefined` if not found or expired
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
  const firstKey = queryResultCache.keys().next().value;
  if (firstKey !== undefined) {
    queryResultCache.delete(firstKey);
  }
}

/**
 * Store a query result in the in-memory cache with a TTL and enforce cache limits.
 *
 * Cleans up any expired entries before storing and evicts the least-recently-used entry if the cache exceeds its maximum size.
 *
 * @typeParam T - Type of the cached value
 * @param key - Cache key for this entry
 * @param value - Query result to cache
 * @param ttlMs - Time-to-live in milliseconds
 * @returns The stored `value`
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

  for (;;) {
    const trimmedStart = remaining.trimStart();
    remaining = trimmedStart;

    // Nothing meaningful left.
    if (remaining.length === 0) {
      return remaining;
    }

    // Consume leading line comment.
    if (remaining.startsWith('--')) {
      const newlineIndex = remaining.indexOf('\n');
      remaining = newlineIndex === -1 ? '' : remaining.slice(newlineIndex + 1);
      continue;
    }

    // Consume leading block comment.
    if (remaining.startsWith('/*')) {
      const endIndex = remaining.indexOf('*/', 2);
      remaining = endIndex === -1 ? '' : remaining.slice(endIndex + 2);
      continue;
    }

    // No more leading comments to consume.
    return remaining;
  }
}

/**
 * Determines whether a SQL query is eligible for read-result caching.
 *
 * Only queries whose first non-comment token is `SELECT` are considered cacheable;
 * other statement types (INSERT/UPDATE/DELETE/PRAGMA/etc.) are excluded to avoid stale reads.
 *
 * @param sql - The SQL query string to evaluate
 * @returns `true` if the query's first non-comment token is `SELECT`, `false` otherwise
 */
function isCacheableReadQuery(sql: string): boolean {
  const normalized = stripLeadingSqlComments(sql).toUpperCase();
  return normalized.startsWith('SELECT');
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
function patchPrepareWithCache(database: Database.Database, options: PreparePatchOptions): void {
  // Never patch statement methods in writable mode.
  if (!options.readonly) {
    return;
  }

  const originalPrepare = database.prepare.bind(database);

  const wrappedPrepare: Database.Database['prepare'] = ((sql: string) => {
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
  }) as Database.Database['prepare'];

  database.prepare = wrappedPrepare;
}

/**
 * Get the filesystem path to the SQLite database used by the application.
 *
 * If the `DB_PATH` environment variable is set its value is returned; otherwise
 * returns an absolute path to `nba_raw_data.db` in the current working directory.
 *
 * @returns The database file path; when `DB_PATH` is unset, an absolute path to `nba_raw_data.db`
 */
function dbPath(): string {
  const envPath = process.env['DB_PATH'];
  if (envPath !== undefined) return envPath;
  return path.join(process.cwd(), 'nba_raw_data.db');
}

/**
 * Get the singleton read-only SQLite Database configured with WAL journaling, foreign key enforcement, and automatic query caching.
 *
 * @returns The singleton Database instance configured for read-only access, WAL journaling, foreign key enforcement, and automatic query caching.
 */
export function getDb(): Database.Database {
  if (!db) {
    const readonly = true;
    db = new Database(dbPath(), { readonly });
    patchPrepareWithCache(db, { readonly });
    db.pragma('foreign_keys = ON');
  }

  return db;
}

/**
 * Execute a SQL query and cache its single-row result.
 *
 * @param sql - SQL query string with placeholders
 * @param params - Positional parameter values for the query
 * @param ttlMs - Cache TTL in milliseconds (default: 30000)
 * @returns `T` or `undefined` — the first row returned by the query
 * @typeParam T - Expected row shape
 */
export function getCachedQueryOne<T>(sql: string, params: unknown[], ttlMs = 30_000): T {
  const key = `one:${buildQueryCacheKey(sql, params)}`;
  const cached = readCachedResult<T>(key);
  if (cached !== undefined) return cached;

  const result = getDb()
    .prepare(sql)
    .get(...params) as T;
  return writeCachedResult(key, result, ttlMs);
}

/**
 * Executes a SQL query that returns multiple rows and caches the result for the specified TTL.
 *
 * @param sql - SQL query string with placeholders
 * @param params - Values to bind to the query placeholders in order
 * @param ttlMs - Cache TTL in milliseconds (default: 30_000)
 * @returns The query result; typically an array of rows conforming to `T`
 * @typeParam T - Expected shape of the returned rows
 */
export function getCachedQueryMany<T>(sql: string, params: unknown[], ttlMs = 30_000): T {
  const key = `many:${buildQueryCacheKey(sql, params)}`;
  const cached = readCachedResult<T>(key);
  if (cached !== undefined) return cached;

  const result = getDb()
    .prepare(sql)
    .all(...params) as T;
  return writeCachedResult(key, result, ttlMs);
}

/**
 * Retrieve the most recent season ID from the database.
 *
 * If the seasons table is empty or no row is found, returns a fallback season ID computed from the current date assuming an NBA season starts in October (format `YYYY-YY`, e.g., `2025-26`).
 *
 * @returns The latest season ID (e.g., `2024-25`) or a computed fallback in `YYYY-YY` format when no row exists.
 */
export function getLatestSeasonId(): string {
  const row = getDb()
    .prepare('SELECT season_id FROM dim_season ORDER BY start_year DESC LIMIT 1')
    .get() as { season_id: string } | undefined;

  if (row !== undefined && row.season_id.length > 0) {
    return row.season_id;
  }

  // Calculate current NBA season dynamically (NBA season: Oct-June)
  // Use the year of October (start of season)
  const now = new Date();
  const year = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${(year + 1).toString().slice(-2)}`;
}
