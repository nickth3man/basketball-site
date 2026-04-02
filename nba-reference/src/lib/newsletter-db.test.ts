/**
 * @fileoverview Integration tests for the newsletter database module.
 *
 * Tests cover:
 * - New subscription creation
 * - Idempotent re-subscribe behavior
 * - Unsubscribe then resubscribe (reactivation)
 * - Token uniqueness per subscriber
 * - Email case insensitivity
 * - Empty and malformed token rejection
 * - Active subscriber counting
 * - findActiveSubscriber behavior for unsubscribed users
 *
 * @module @/lib/newsletter-db.test
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addSubscriber,
  closeNewsletterDb,
  countActiveSubscribers,
  findActiveSubscriber,
  getNewsletterDb,
  unsubscribeByToken,
} from '@/lib/newsletter-db';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TEST_DB_PATH = join(tmpdir(), `newsletter-test-${randomUUID()}.db`);

beforeEach(() => {
  process.env['NEWSLETTER_DB_PATH'] = TEST_DB_PATH;
  getNewsletterDb();
});

afterEach(() => {
  closeNewsletterDb();
  try {
    rmSync(TEST_DB_PATH, { force: true });
  } catch {
    // Ignore cleanup errors
  }
  delete process.env['NEWSLETTER_DB_PATH'];
});

describe('addSubscriber', () => {
  it('creates a new subscriber with isNew: true', () => {
    const result = addSubscriber('newuser@example.com');

    expect(result.isNew).toBe(true);
    expect(result.subscriber.email).toBe('newuser@example.com');
    expect(result.subscriber.unsubscribed_at).toBeNull();
    expect(result.subscriber.source).toBe('web');
    expect(result.subscriber.preference).toBe('daily');
  });

  it('returns isNew: false for idempotent re-subscribe', () => {
    const first = addSubscriber('repeat@example.com');
    expect(first.isNew).toBe(true);

    const second = addSubscriber('repeat@example.com');
    expect(second.isNew).toBe(false);
    expect(second.subscriber.email).toBe('repeat@example.com');
  });

  it('returns isNew: true when resubscribing after unsubscribe (reactivation)', () => {
    const sub = addSubscriber('reactivate@example.com');
    const token = sub.subscriber.unsubscribe_token;

    const unsubscribed = unsubscribeByToken(token);
    expect(unsubscribed).toBe(true);

    const reactivated = addSubscriber('reactivate@example.com');
    expect(reactivated.isNew).toBe(true);
    expect(reactivated.subscriber.unsubscribed_at).toBeNull();
  });

  it('generates a unique 64-char hex token for each subscriber', () => {
    const sub1 = addSubscriber('user1@example.com');
    const sub2 = addSubscriber('user2@example.com');

    expect(sub1.subscriber.unsubscribe_token).toMatch(/^[0-9a-f]{64}$/i);
    expect(sub2.subscriber.unsubscribe_token).toMatch(/^[0-9a-f]{64}$/i);
    expect(sub1.subscriber.unsubscribe_token).not.toBe(sub2.subscriber.unsubscribe_token);
  });

  it('treats email as case-insensitive (same record)', () => {
    const sub1 = addSubscriber('Test@Example.com');
    expect(sub1.isNew).toBe(true);

    const sub2 = addSubscriber('test@example.com');
    expect(sub2.isNew).toBe(false);
    expect(sub2.subscriber.id).toBe(sub1.subscriber.id);
  });
});

describe('unsubscribeByToken', () => {
  it('returns false for empty token', () => {
    const result = unsubscribeByToken('');
    expect(result).toBe(false);
  });

  it('returns false for malformed (non-hex) token', () => {
    const result = unsubscribeByToken('not-hex');
    expect(result).toBe(false);
  });

  it('returns false for valid-format token that does not exist', () => {
    const fakeToken = 'a'.repeat(64);
    const result = unsubscribeByToken(fakeToken);
    expect(result).toBe(false);
  });

  it('successfully unsubscribes a valid token', () => {
    const sub = addSubscriber('unsub@example.com');
    const token = sub.subscriber.unsubscribe_token;

    const result = unsubscribeByToken(token);
    expect(result).toBe(true);

    const active = findActiveSubscriber('unsub@example.com');
    expect(active).toBeUndefined();
  });
});

describe('countActiveSubscribers', () => {
  it('returns 0 when no subscribers exist', () => {
    expect(countActiveSubscribers()).toBe(0);
  });

  it('returns correct count after subscribing and unsubscribing', () => {
    addSubscriber('a@example.com');
    addSubscriber('b@example.com');
    addSubscriber('c@example.com');
    expect(countActiveSubscribers()).toBe(3);

    const subB = findActiveSubscriber('b@example.com');
    expect(subB).toBeDefined();
    if (subB) {
      unsubscribeByToken(subB.unsubscribe_token);
    }

    expect(countActiveSubscribers()).toBe(2);
  });
});

describe('findActiveSubscriber', () => {
  it('returns undefined for unsubscribed users', () => {
    const sub = addSubscriber('willunsub@example.com');
    unsubscribeByToken(sub.subscriber.unsubscribe_token);

    const active = findActiveSubscriber('willunsub@example.com');
    expect(active).toBeUndefined();
  });

  it('returns the subscriber for active users', () => {
    addSubscriber('active@example.com');

    const found = findActiveSubscriber('active@example.com');
    expect(found).toBeDefined();
    expect(found?.email).toBe('active@example.com');
    expect(found?.unsubscribed_at).toBeNull();
  });
});
