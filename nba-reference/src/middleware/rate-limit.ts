/**
 * Rate limiting middleware for API routes.
 *
 * Provides simple in-memory rate limiting based on IP address.
 * In production, this should be replaced with Redis or similar
 * for distributed rate limiting across multiple server instances.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isIP } from 'node:net';

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT = 100; // requests per window
const WINDOW_MS = 60_000; // 1 minute in milliseconds
const CLEANUP_INTERVAL_MS = 5 * 60_000; // Clean up every 5 minutes

const IP_HEADER_CANDIDATES = [
  'x-vercel-forwarded-for',
  'x-forwarded-for',
  'cf-connecting-ip',
  'x-real-ip',
];

function normalizeIpCandidate(value: string): string | null {
  const firstSegment = value.split(',')[0]?.trim();
  if (firstSegment == null || firstSegment.length === 0) return null;

  const withoutPort =
    firstSegment.includes('.') && firstSegment.includes(':')
      ? (firstSegment.split(':')[0] ?? firstSegment)
      : firstSegment;

  if (withoutPort.length > 45) return null;
  if (isIP(withoutPort) !== 0) {
    return withoutPort;
  }

  return null;
}

export function extractClientIp(req: NextRequest): string {
  for (const header of IP_HEADER_CANDIDATES) {
    const rawValue = req.headers.get(header);
    if (rawValue == null || rawValue.length === 0) continue;
    const normalized = normalizeIpCandidate(rawValue);
    if (normalized != null) return normalized;
  }

  return 'unknown';
}

/**
 * Cleans up old entries from the rate limit store to prevent memory leaks.
 * Removes entries with no recent requests.
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  for (const [key, entry] of rateLimitStore.entries()) {
    pruneExpiredTimestamps(entry.timestamps, windowStart);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

// Track last cleanup time for opportunistic cleanup (avoids persistent timer)
let lastCleanupTime = 0;

function maybeCleanup(now: number): void {
  if (now - lastCleanupTime < CLEANUP_INTERVAL_MS) return;
  lastCleanupTime = now;
  cleanupOldEntries();
}

function pruneExpiredTimestamps(timestamps: number[], windowStart: number): void {
  let removeCount = 0;
  for (const timestamp of timestamps) {
    if (timestamp > windowStart) break;
    removeCount += 1;
  }
  if (removeCount > 0) {
    timestamps.splice(0, removeCount);
  }
}

/**
 * Enforces per-IP rate limiting for an incoming request and returns a 429 response when the limit is exceeded.
 *
 * Extracts the client IP from the `x-forwarded-for` header (first value) or `x-real-ip`. If the IP has made
 * at least the configured number of requests within the time window, a 429 `NextResponse` is returned containing
 * an error message and `X-RateLimit-*` headers; otherwise the request is recorded and the function returns `null`.
 *
 * @param req - Next.js request object (client IP is derived from `x-forwarded-for` or `x-real-ip`)
 * @returns `NextResponse` with status 429 and rate-limit headers when the IP is over the limit, `null` otherwise
 */
export function checkRateLimit(req: NextRequest): NextResponse | null {
  const ip = extractClientIp(req);

  const now = Date.now();
  maybeCleanup(now);
  const windowStart = now - WINDOW_MS;

  const entry = rateLimitStore.get(ip) ?? { timestamps: [] };
  pruneExpiredTimestamps(entry.timestamps, windowStart);
  const recentRequests = entry.timestamps;

  if (recentRequests.length >= RATE_LIMIT) {
    const oldestRequest = recentRequests[0] ?? now;
    const resetEpochSec = Math.ceil((oldestRequest + WINDOW_MS) / 1000);
    const retryAfterSec = Math.max(0, resetEpochSec - Math.ceil(now / 1000));
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfterSec} seconds.`,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetEpochSec),
          'Retry-After': String(retryAfterSec),
        },
      }
    );
  }

  recentRequests.push(now);
  rateLimitStore.set(ip, { timestamps: recentRequests });

  return null;
}

/**
 * Retrieve the remaining request count and reset timestamp for the given client IP.
 *
 * @param ip - Client IP address to query
 * @returns The current rate limit status: `remaining` is requests left in the current window, `reset` is the epoch milliseconds when the window will reset
 */
export function getRateLimitStatus(ip: string): { remaining: number; reset: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    return { remaining: RATE_LIMIT, reset: now + WINDOW_MS };
  }

  pruneExpiredTimestamps(entry.timestamps, windowStart);
  const recentRequests = entry.timestamps;
  const oldestRequest = recentRequests[0] ?? now;

  return {
    remaining: Math.max(0, RATE_LIMIT - recentRequests.length),
    reset: oldestRequest + WINDOW_MS,
  };
}
