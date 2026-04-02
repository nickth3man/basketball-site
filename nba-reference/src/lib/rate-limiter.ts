/**
 * @fileoverview In-memory per-IP rate limiter.
 *
 * Provides a factory function that creates a rate-limiting check
 * based on a maximum number of requests within a sliding time window.
 *
 * @module @/lib/rate-limiter
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/** Result of a rate-limit check. */
export interface RateLimitResult {
  /** Whether the request is allowed under the current rate limit. */
  allowed: boolean;
  /** Number of remaining requests allowed in the current window. */
  remaining: number;
}

/** The storage map keyed by client IP address. */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Create a rate-limiting function with the given parameters.
 *
 * @param maxRequests - Maximum number of requests allowed within the window.
 * @param windowMs - Time window in milliseconds.
 * @returns A function that accepts an IP string and returns a {@link RateLimitResult}.
 */
export function createRateLimiter(
  maxRequests: number,
  windowMs: number
): (ip: string) => RateLimitResult {
  return function checkRateLimit(ip: string): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    entry.count += 1;
    return { allowed: true, remaining: maxRequests - entry.count };
  };
}

/**
 * Extract the client IP address from a Next.js request.
 *
 * Checks `x-forwarded-for` first (taking the first IP in the chain),
 * then falls back to `x-real-ip`, and finally to `'unknown'`.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded != null && forwarded.length > 0) {
    const firstIp = forwarded.split(',')[0];
    if (firstIp != null) {
      return firstIp.trim();
    }
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp != null && realIp.length > 0) {
    return realIp.trim();
  }
  return 'unknown';
}

/**
 * Clean up expired entries from the rate limit store.
 *
 * This is optional but useful for long-running processes to prevent
 * unbounded memory growth. Call periodically or on a timer.
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Clear all entries from the rate limit store.
 *
 * Intended for use in test teardown to prevent rate-limit
 * state from leaking between test cases.
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
