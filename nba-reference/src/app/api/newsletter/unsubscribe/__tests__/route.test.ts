import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

vi.mock('@/lib/newsletter-db', () => ({
  unsubscribeByToken: vi.fn(),
}));

vi.mock('@/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  extractClientIp: vi.fn(() => '127.0.0.1'),
  getRateLimitStatus: vi.fn(() => ({ remaining: 99, reset: 1_710_000_000_000 })),
  RATE_LIMIT: 100,
}));

import { unsubscribeByToken } from '@/lib/newsletter-db';
import { checkRateLimit } from '@/middleware/rate-limit';
import { GET } from '@/app/api/newsletter/unsubscribe/route';

const unsubscribeByTokenMock = vi.mocked(unsubscribeByToken);
const checkRateLimitMock = vi.mocked(checkRateLimit);

function makeRequest(token?: string): NextRequest {
  const url =
    token != null
      ? `http://localhost/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
      : 'http://localhost/api/newsletter/unsubscribe';
  return new NextRequest(url);
}

describe('GET /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockReturnValue(null);
  });

  it('unsubscribes successfully with a valid token', async () => {
    unsubscribeByTokenMock.mockReturnValue(true);

    const req = makeRequest('validtoken123');
    const res = GET(req);
    const body = (await res.json()) as { status: string };

    expect(res.status).toBe(200);
    expect(body.status).toBe('unsubscribed');
    expect(unsubscribeByTokenMock).toHaveBeenCalledWith('validtoken123');
  });

  it('returns 404 when token is not found or already used', async () => {
    unsubscribeByTokenMock.mockReturnValue(false);

    const req = makeRequest('unknowntoken');
    const res = GET(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('token_not_found');
  });

  it('returns 400 when token is missing', async () => {
    const req = makeRequest();
    const res = GET(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('missing_token');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('returns 400 for empty token parameter', async () => {
    const req = makeRequest('');
    const res = GET(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('missing_token');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limited', () => {
    checkRateLimitMock.mockReturnValue(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = makeRequest('sometoken');
    const res = GET(req);

    expect(res.status).toBe(429);
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('returns 500 when unsubscribeByToken throws', async () => {
    unsubscribeByTokenMock.mockImplementation(() => {
      throw new Error('DB crash');
    });

    const req = makeRequest('sometoken');
    const res = GET(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('unsubscribe_failed');
  });

  it('includes cache and CORS headers on success', () => {
    unsubscribeByTokenMock.mockReturnValue(true);

    const req = makeRequest('validtoken');
    const res = GET(req);

    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
