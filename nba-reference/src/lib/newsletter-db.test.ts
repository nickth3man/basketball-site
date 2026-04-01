import { afterEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

/**
 * Use a temporary file-based SQLite DB for each test so tests are isolated
 * and do not rely on environment variables or the production DB path.
 */

// Override the DB path to a temp file before importing the module
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'newsletter-db-test-'));
const tmpDbPath = path.join(tmpDir, 'test-newsletter.db');

vi.stubEnv('NEWSLETTER_DB_PATH', tmpDbPath);

import {
  addSubscriber,
  closeNewsletterDb,
  countActiveSubscribers,
  findActiveSubscriber,
  getSentEditions,
  countSentEditions,
  resolveNewsletterDbPath,
  unsubscribeByToken,
} from '@/lib/newsletter-db';

describe('newsletter-db', () => {
  afterEach(() => {
    closeNewsletterDb();
  });

  afterEach(() => {
    // Delete the DB file after each test group so each test starts fresh
    try {
      fs.unlinkSync(tmpDbPath);
      // Also remove WAL/SHM files if present
      fs.unlinkSync(`${tmpDbPath}-wal`);
      fs.unlinkSync(`${tmpDbPath}-shm`);
    } catch {
      // ignore missing files
    }
  });

  // -------------------------------------------------------------------------
  // resolveNewsletterDbPath
  // -------------------------------------------------------------------------
  describe('resolveNewsletterDbPath', () => {
    it('returns the NEWSLETTER_DB_PATH env value when set', () => {
      expect(resolveNewsletterDbPath()).toBe(tmpDbPath);
    });
  });

  // -------------------------------------------------------------------------
  // addSubscriber
  // -------------------------------------------------------------------------
  describe('addSubscriber', () => {
    it('creates a new subscriber and returns the record', () => {
      const result = addSubscriber('newuser@example.com');

      expect(result.isNew).toBe(true);
      expect(result.subscriber.email).toBe('newuser@example.com');
      expect(result.subscriber.preference).toBe('daily');
      expect(result.subscriber.source).toBe('web');
      expect(result.subscriber.unsubscribed_at).toBeNull();
      expect(typeof result.subscriber.unsubscribe_token).toBe('string');
      expect(result.subscriber.unsubscribe_token.length).toBeGreaterThan(0);
    });

    it('stores custom source and preference', () => {
      const result = addSubscriber('pref@example.com', 'footer', 'weekly');
      expect(result.subscriber.source).toBe('footer');
      expect(result.subscriber.preference).toBe('weekly');
    });

    it('is idempotent for an active subscriber — returns existing row with isNew=false', () => {
      const first = addSubscriber('dup@example.com');
      const second = addSubscriber('dup@example.com');
      expect(second.isNew).toBe(false);
      expect(second.subscriber.id).toBe(first.subscriber.id);
      expect(second.subscriber.unsubscribe_token).toBe(first.subscriber.unsubscribe_token);
    });

    it('reactivates an unsubscribed address with isNew=true', () => {
      const sub = addSubscriber('comeback@example.com');
      const token = sub.subscriber.unsubscribe_token;
      unsubscribeByToken(token);

      const reactivated = addSubscriber('comeback@example.com');
      expect(reactivated.isNew).toBe(true);
      expect(reactivated.subscriber.unsubscribed_at).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // findActiveSubscriber
  // -------------------------------------------------------------------------
  describe('findActiveSubscriber', () => {
    it('returns the subscriber when active', () => {
      addSubscriber('findme@example.com');
      const found = findActiveSubscriber('findme@example.com');
      expect(found?.email).toBe('findme@example.com');
    });

    it('returns undefined for unknown email', () => {
      expect(findActiveSubscriber('nobody@example.com')).toBeUndefined();
    });

    it('returns undefined after unsubscribe', () => {
      const result = addSubscriber('gone@example.com');
      unsubscribeByToken(result.subscriber.unsubscribe_token);
      expect(findActiveSubscriber('gone@example.com')).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // unsubscribeByToken
  // -------------------------------------------------------------------------
  describe('unsubscribeByToken', () => {
    it('marks subscriber as unsubscribed and returns true', () => {
      const result = addSubscriber('unsub@example.com');
      const success = unsubscribeByToken(result.subscriber.unsubscribe_token);
      expect(success).toBe(true);
    });

    it('returns false for an unknown token', () => {
      expect(unsubscribeByToken('totallymadeup')).toBe(false);
    });

    it('returns false for an empty token', () => {
      expect(unsubscribeByToken('')).toBe(false);
    });

    it('returns false when token already used (double unsubscribe)', () => {
      const result = addSubscriber('dbl@example.com');
      unsubscribeByToken(result.subscriber.unsubscribe_token);
      const second = unsubscribeByToken(result.subscriber.unsubscribe_token);
      expect(second).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // countActiveSubscribers
  // -------------------------------------------------------------------------
  describe('countActiveSubscribers', () => {
    it('returns 0 when no subscribers', () => {
      expect(countActiveSubscribers()).toBe(0);
    });

    it('counts only active subscribers', () => {
      addSubscriber('a@example.com');
      addSubscriber('b@example.com');
      const result = addSubscriber('c@example.com');
      unsubscribeByToken(result.subscriber.unsubscribe_token);

      expect(countActiveSubscribers()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // getSentEditions / countSentEditions
  // -------------------------------------------------------------------------
  describe('getSentEditions / countSentEditions', () => {
    it('returns empty array and 0 count when no editions', () => {
      expect(getSentEditions()).toHaveLength(0);
      expect(countSentEditions()).toBe(0);
    });
  });
});
