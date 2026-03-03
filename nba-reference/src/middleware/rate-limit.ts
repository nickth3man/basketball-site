/**
 * Rate limiting middleware for API routes.
 *
 * Provides simple in-memory rate limiting based on IP address.
 * In production, this should be replaced with Redis or similar
 * for distributed rate limiting across multiple server instances.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT = 100; // requests per window
const WINDOW_MS = 60_000; // 1 minute in milliseconds
const CLEANUP_INTERVAL_MS = 5 * 60_000; // Clean up every 5 minutes

/**
 * Cleans up old entries from the rate limit store to prevent memory leaks.
 * Removes entries with no recent requests.
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  for (const [key, entry] of rateLimitStore.entries()) {
    const recentRequests = entry.timestamps.filter(timestamp => timestamp > windowStart);
    if (recentRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      entry.timestamps = recentRequests;
    }
  }
}

// Schedule periodic cleanup
setInterval(cleanupOldEntries, CLEANUP_INTERVAL_MS);

/**
 * Rate limiting check for API requests.
 *
 * Tracks requests per IP address and returns 429 Too Many Requests
 * if the limit is exceeded within the time window.
 *
 * @param req - Next.js request object
 * @returns NextResponse with 429 status if rate limited, null if allowed
 *
 * @example
 * const rateLimitResponse = checkRateLimit(req);
 * if (rateLimitResponse) return rateLimitResponse;
 * // Continue with normal request handling
 */
export function checkRateLimit(req: NextRequest): NextResponse | null {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() ?? realIp ?? 'unknown';

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const entry = rateLimitStore.get(ip) ?? { timestamps: [] };
  const recentRequests = entry.timestamps.filter(timestamp => timestamp > windowStart);

  if (recentRequests.length >= RATE_LIMIT) {
    const oldestRequest = recentRequests[0] ?? now;
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(WINDOW_MS / 1000)} seconds.`,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil((oldestRequest + WINDOW_MS) / 1000)),
        },
      }
    );
  }

  recentRequests.push(now);
  rateLimitStore.set(ip, { timestamps: recentRequests });

  return null;
}

/**
 * Get current rate limit status for an IP.
 *
 * @param ip - Client IP address
 * @returns Object with remaining requests and reset time
 */
export function getRateLimitStatus(ip: string): { remaining: number; reset: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    return { remaining: RATE_LIMIT, reset: now + WINDOW_MS };
  }

  const recentRequests = entry.timestamps.filter(timestamp => timestamp > windowStart);
  const oldestRequest = recentRequests[0] ?? now;

  return {
    remaining: Math.max(0, RATE_LIMIT - recentRequests.length),
    reset: oldestRequest + WINDOW_MS,
  };
}
