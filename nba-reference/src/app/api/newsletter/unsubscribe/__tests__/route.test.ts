import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/newsletter-db', () => ({
  unsubscribeByToken: vi.fn(),
}));

import { unsubscribeByToken } from '@/lib/newsletter-db';
import { POST } from '@/app/api/newsletter/unsubscribe/route';

const unsubscribeByTokenMock = vi.mocked(unsubscribeByToken);

function makeRequest(token?: string): NextRequest {
  const url = 'http://localhost/api/newsletter/unsubscribe';
  if (token != null) {
    return new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

describe('POST /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unsubscribes successfully with a valid token', async () => {
    unsubscribeByTokenMock.mockReturnValue(true);

    const req = makeRequest('validtoken123');
    const res = await POST(req);
    const body = (await res.json()) as { status: string };

    expect(res.status).toBe(200);
    expect(body.status).toBe('unsubscribed');
    expect(unsubscribeByTokenMock).toHaveBeenCalledWith('validtoken123');
  });

  it('returns 404 when token is not found or already used', async () => {
    unsubscribeByTokenMock.mockReturnValue(false);

    const req = makeRequest('unknowntoken');
    const res = await POST(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('token_not_found');
  });

  it('returns 400 when token is missing', async () => {
    const req = makeRequest();
    const res = await POST(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('missing_token');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('returns 400 for empty token parameter', async () => {
    const req = makeRequest('');
    const res = await POST(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('missing_token');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('returns 500 when unsubscribeByToken throws', async () => {
    unsubscribeByTokenMock.mockImplementation(() => {
      throw new Error('DB crash');
    });

    const req = makeRequest('sometoken');
    const res = await POST(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('unsubscribe_failed');
  });

  it('includes cache and CORS headers on success', async () => {
    unsubscribeByTokenMock.mockReturnValue(true);

    const req = makeRequest('validtoken');
    const res = await POST(req);

    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
