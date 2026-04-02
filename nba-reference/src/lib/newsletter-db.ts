import 'server-only';

/**
 * @fileoverview Newsletter database module — manages writable SQLite storage for
 * subscriber records and newsletter editions.
 *
 * Unlike the main read-only NBA stats database, this module opens (or creates)
 * a separate writable SQLite file so subscriber data can be persisted without
 * touching the read-only source.
 *
 * @module @/lib/newsletter-db
 */

import Database, { SqliteError } from 'better-sqlite3';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import { logWarn } from '@/lib/logger';

/** Singleton writable database instance */
let newsletterDb: Database.Database | null = null;

/**
 * Resolve the filesystem path for the newsletter SQLite database.
 *
 * Uses the `NEWSLETTER_DB_PATH` environment variable when set; otherwise
 * falls back to `newsletter.db` in the same directory as the main database.
 *
 * @returns Absolute path to the newsletter database file
 */
export function resolveNewsletterDbPath(): string {
  const envPath = process.env['NEWSLETTER_DB_PATH'];
  if (envPath !== undefined && envPath.trim().length > 0) return envPath.trim();
  const _dir = dirname(fileURLToPath(import.meta.url));
  return join(_dir, '../../../db/newsletter.db');
}

/**
 * Return the singleton writable newsletter Database instance, creating
 * the schema tables if they do not yet exist.
 *
 * @returns Writable `better-sqlite3` Database instance
 */
export function getNewsletterDb(): Database.Database {
  if (!newsletterDb) {
    const dbPath = resolveNewsletterDbPath();
    if (!existsSync(dbPath)) {
      logWarn('Newsletter database file not found, creating new file', { path: dbPath });
    }
    newsletterDb = new Database(dbPath);
    newsletterDb.pragma('journal_mode = WAL');
    newsletterDb.pragma('foreign_keys = ON');
    applySchema(newsletterDb);
  }
  return newsletterDb;
}

/**
 * Create the `subscribers` and `newsletter_editions` tables if they do not
 * already exist.
 *
 * @param db - Open writable Database instance
 */
function applySchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      email           TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      subscribed_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      unsubscribed_at TEXT,
      source          TEXT    NOT NULL DEFAULT 'web',
      preference      TEXT    NOT NULL DEFAULT 'daily',
      unsubscribe_token TEXT  NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS newsletter_editions (
      edition_id    INTEGER PRIMARY KEY AUTOINCREMENT,
      date          TEXT NOT NULL UNIQUE,
      subject_line  TEXT NOT NULL,
      html_content  TEXT NOT NULL,
      sent_at       TEXT,
      open_rate     REAL
    );
  `);
}

// ---------------------------------------------------------------------------
// Subscriber helpers
// ---------------------------------------------------------------------------

export interface Subscriber {
  id: number;
  email: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  source: string;
  preference: 'daily' | 'weekly';
  unsubscribe_token: string;
}

/**
 * Result returned by {@link addSubscriber}.
 */
export interface AddSubscriberResult {
  subscriber: Subscriber;
  /** `true` when the subscriber record was just created or reactivated. */
  isNew: boolean;
}

/**
 * Insert a new active subscriber. Returns an `AddSubscriberResult` containing
 * the subscriber row and whether it was newly created.
 *
 * If the email is already actively subscribed the existing record is returned
 * with `isNew: false`. If the email previously unsubscribed, the record is
 * reactivated with `isNew: true`.
 *
 * @param email      - Validated subscriber email address
 * @param source     - Origin of the signup (e.g., `'web'`, `'footer'`)
 * @param preference - Newsletter frequency preference
 */
export function addSubscriber(
  email: string,
  source = 'web',
  preference: 'daily' | 'weekly' = 'daily'
): AddSubscriberResult {
  const db = getNewsletterDb();

  const existing = db
    .prepare('SELECT * FROM subscribers WHERE email = ? COLLATE NOCASE')
    .get(email) as Subscriber | undefined;

  if (existing) {
    if (existing.unsubscribed_at === null) {
      // Already actively subscribed — treat as idempotent success
      return { subscriber: existing, isNew: false };
    }
    // Reactivate unsubscribed record
    db.prepare(
      `UPDATE subscribers
          SET unsubscribed_at = NULL,
              subscribed_at   = strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
              source          = ?,
              preference      = ?
        WHERE email = ? COLLATE NOCASE`
    ).run(source, preference, email);

    return {
      subscriber: db
        .prepare('SELECT * FROM subscribers WHERE email = ? COLLATE NOCASE')
        .get(email) as Subscriber,
      isNew: true,
    };
  }

  const token = crypto.randomBytes(32).toString('hex');
  try {
    const info = db
      .prepare(
        `INSERT INTO subscribers (email, source, preference, unsubscribe_token)
         VALUES (?, ?, ?, ?)`
      )
      .run(email, source, preference, token);

    return {
      subscriber: db
        .prepare('SELECT * FROM subscribers WHERE id = ?')
        .get(info.lastInsertRowid) as Subscriber,
      isNew: true,
    };
  } catch (err) {
    if (err instanceof SqliteError && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      // Concurrent request inserted the same email — treat as idempotent success
      const reselected = db
        .prepare('SELECT * FROM subscribers WHERE email = ? COLLATE NOCASE')
        .get(email) as Subscriber | undefined;
      if (reselected) {
        return { subscriber: reselected, isNew: false };
      }
    }
    throw err;
  }
}

/**
 * Mark a subscriber as unsubscribed by their unsubscribe token.
 *
 * @param token - The per-subscriber unsubscribe token from email footer links
 * @returns `true` if a matching active subscriber was found and updated,
 *          `false` otherwise
 */
/** Expected format for unsubscribe tokens: 64 hex characters (32 bytes). */
const TOKEN_HEX_RE = /^[0-9a-f]{64}$/i;

export function unsubscribeByToken(token: string): boolean {
  if (token.length === 0) return false;
  if (!TOKEN_HEX_RE.test(token)) return false;

  const db = getNewsletterDb();
  const info = db
    .prepare(
      `UPDATE subscribers
          SET unsubscribed_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
        WHERE unsubscribe_token = ?
          AND unsubscribed_at IS NULL`
    )
    .run(token);

  return info.changes > 0;
}

/**
 * Look up an active subscriber by email address.
 *
 * @param email - Email address to look up
 * @returns Subscriber row if found and active, otherwise `undefined`
 */
export function findActiveSubscriber(email: string): Subscriber | undefined {
  const db = getNewsletterDb();
  return db
    .prepare('SELECT * FROM subscribers WHERE email = ? COLLATE NOCASE AND unsubscribed_at IS NULL')
    .get(email) as Subscriber | undefined;
}

/**
 * Return the total count of active subscribers.
 */
export function countActiveSubscribers(): number {
  const db = getNewsletterDb();
  const row = db
    .prepare('SELECT COUNT(*) AS cnt FROM subscribers WHERE unsubscribed_at IS NULL')
    .get() as { cnt: number };
  return row.cnt;
}

// ---------------------------------------------------------------------------
// Newsletter edition helpers
// ---------------------------------------------------------------------------

export interface NewsletterEdition {
  edition_id: number;
  date: string;
  subject_line: string;
  html_content: string;
  sent_at: string | null;
  open_rate: number | null;
}

/**
 * Retrieve a page of sent newsletter editions, newest first.
 *
 * @param limit  - Maximum rows to return
 * @param offset - Pagination offset
 */
export function getSentEditions(limit = 20, offset = 0): NewsletterEdition[] {
  const db = getNewsletterDb();
  return db
    .prepare(
      `SELECT edition_id, date, subject_line, html_content, sent_at, open_rate
         FROM newsletter_editions
         WHERE sent_at IS NOT NULL
         ORDER BY date DESC
         LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as NewsletterEdition[];
}

/**
 * Retrieve the total count of sent newsletter editions.
 */
export function countSentEditions(): number {
  const db = getNewsletterDb();
  const row = db
    .prepare('SELECT COUNT(*) AS cnt FROM newsletter_editions WHERE sent_at IS NOT NULL')
    .get() as { cnt: number };
  return row.cnt;
}

/**
 * Retrieve a single edition by ID.
 */
export function getEditionById(id: number): NewsletterEdition | undefined {
  const db = getNewsletterDb();
  return db.prepare('SELECT * FROM newsletter_editions WHERE edition_id = ?').get(id) as
    | NewsletterEdition
    | undefined;
}

/**
 * Close the newsletter database connection (used in tests).
 *
 * @internal
 */
export function closeNewsletterDb(): void {
  if (newsletterDb) {
    newsletterDb.close();
    newsletterDb = null;
  }
}
