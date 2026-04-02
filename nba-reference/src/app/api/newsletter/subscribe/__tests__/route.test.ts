import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/newsletter-db', () => ({
  addSubscriber: vi.fn(),
}));

import { addSubscriber } from '@/lib/newsletter-db';
import { POST } from '@/app/api/newsletter/subscribe/route';

const addSubscriberMock = vi.mocked(addSubscriber);

const MOCK_SUBSCRIBER = {
  id: 1,
  email: 'fan@example.com',
  subscribed_at: '2025-01-01T07:00:00Z',
  unsubscribed_at: null,
  source: 'web',
  preference: 'daily' as const,
  unsubscribe_token: 'abc123token',
};

const MOCK_NEW_RESULT = { subscriber: MOCK_SUBSCRIBER, isNew: true };
const MOCK_EXISTING_RESULT = { subscriber: MOCK_SUBSCRIBER, isNew: false };

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/newsletter/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes a new user and returns status=subscribed', async () => {
    addSubscriberMock.mockReturnValue(MOCK_NEW_RESULT);

    const req = makeRequest({ email: 'fan@example.com' });
    const res = await POST(req);
    const body = (await res.json()) as { status: string; unsubscribe_token: string };

    expect(res.status).toBe(200);
    expect(body.status).toBe('subscribed');
    expect(body.unsubscribe_token).toBe('abc123token');
    expect(addSubscriberMock).toHaveBeenCalledWith('fan@example.com', 'web', 'daily');
  });

  it('normalises email to lowercase', async () => {
    addSubscriberMock.mockReturnValue(MOCK_NEW_RESULT);

    const req = makeRequest({ email: 'FAN@EXAMPLE.COM' });
    await POST(req);

    expect(addSubscriberMock).toHaveBeenCalledWith('fan@example.com', 'web', 'daily');
  });

  it('passes source and preference through', async () => {
    addSubscriberMock.mockReturnValue(MOCK_NEW_RESULT);

    const req = makeRequest({
      email: 'fan@example.com',
      source: 'footer',
      preference: 'weekly',
    });
    await POST(req);

    expect(addSubscriberMock).toHaveBeenCalledWith('fan@example.com', 'footer', 'weekly');
  });

  it('defaults unknown preference to daily', async () => {
    addSubscriberMock.mockReturnValue(MOCK_NEW_RESULT);

    const req = makeRequest({ email: 'fan@example.com', preference: 'monthly' });
    await POST(req);

    expect(addSubscriberMock).toHaveBeenCalledWith('fan@example.com', 'web', 'daily');
  });

  it('returns already_subscribed when subscriber already exists', async () => {
    addSubscriberMock.mockReturnValue(MOCK_EXISTING_RESULT);

    const req = makeRequest({ email: 'fan@example.com' });
    const res = await POST(req);
    const body = (await res.json()) as { status: string };

    expect(res.status).toBe(200);
    expect(body.status).toBe('already_subscribed');
  });

  it('returns 400 for missing email', async () => {
    const req = makeRequest({});
    const res = await POST(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('missing_email');
    expect(addSubscriberMock).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid email format', async () => {
    const req = makeRequest({ email: 'not-an-email' });
    const res = await POST(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_email');
    expect(addSubscriberMock).not.toHaveBeenCalled();
  });

  it('returns 400 for email that is too long', async () => {
    const req = makeRequest({ email: `${'a'.repeat(250)}@example.com` });
    const res = await POST(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_email');
    expect(addSubscriberMock).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{',
    });
    const res = await POST(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_json');
    expect(addSubscriberMock).not.toHaveBeenCalled();
  });

  it('returns 500 when addSubscriber throws', async () => {
    addSubscriberMock.mockImplementation(() => {
      throw new Error('DB error');
    });

    const req = makeRequest({ email: 'fan@example.com' });
    const res = await POST(req);
    const body = (await res.json()) as { error: { code: string } };

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('subscribe_failed');
  });

  it('includes cache and CORS headers', async () => {
    addSubscriberMock.mockReturnValue(MOCK_NEW_RESULT);

    const req = makeRequest({ email: 'fan@example.com' });
    const res = await POST(req);

    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
