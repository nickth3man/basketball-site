import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { checkRateLimit, extractClientIp, getRateLimitStatus } from '@/middleware/rate-limit';

function createRequest(headers?: Record<string, string>): NextRequest {
  if (headers == null) {
    return new NextRequest('http://localhost/api/search?q=ja');
  }

  return new NextRequest('http://localhost/api/search?q=ja', { headers });
}

describe('rate limit middleware', () => {
  it('extracts first forwarded IP when multiple values are present', () => {
    const req = createRequest({
      'x-forwarded-for': '203.0.113.10, 198.51.100.4',
    });

    expect(extractClientIp(req)).toBe('203.0.113.10');
  });

  it('falls back through supported IP headers', () => {
    const req = createRequest({
      'x-real-ip': '198.51.100.42',
    });

    expect(extractClientIp(req)).toBe('198.51.100.42');
  });

  it('returns unknown for malformed IP values', () => {
    const req = createRequest({
      'x-forwarded-for': 'malicious-header-value',
    });

    expect(extractClientIp(req)).toBe('unknown');
  });

  it('allows requests under the limit and blocks when exceeded', async () => {
    const ip = `198.51.100.${Math.floor(Math.random() * 100) + 100}`;

    for (let i = 0; i < 100; i += 1) {
      const req = createRequest({ 'x-real-ip': ip });
      expect(checkRateLimit(req)).toBeNull();
    }

    const blockedResponse = checkRateLimit(createRequest({ 'x-real-ip': ip }));
    expect(blockedResponse).not.toBeNull();
    expect(blockedResponse?.status).toBe(429);

    const payload = (await blockedResponse?.json()) as { error: string; message: string };
    expect(payload.error).toBe('Too many requests');
    expect(payload.message).toContain('Rate limit exceeded');
    expect(blockedResponse?.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(blockedResponse?.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(blockedResponse?.headers.get('Retry-After')).toBeTruthy();
  });

  it('reports remaining count and reset timestamp', () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 100) + 100}`;
    checkRateLimit(createRequest({ 'x-real-ip': ip }));

    const status = getRateLimitStatus(ip);
    expect(status.remaining).toBeGreaterThanOrEqual(0);
    expect(status.remaining).toBeLessThanOrEqual(99);
    expect(status.reset).toBeGreaterThan(Date.now());
  });
});
