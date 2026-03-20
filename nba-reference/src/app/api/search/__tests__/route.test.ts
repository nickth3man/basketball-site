import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Route } from 'next';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

vi.mock('@/lib/query/search', () => ({
  SEARCH_RESULT_TYPES: ['player', 'team', 'season', 'game', 'award', 'page'],
  searchEntities: vi.fn(),
}));

vi.mock('@/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  extractClientIp: vi.fn(() => '127.0.0.1'),
  getRateLimitStatus: vi.fn(() => ({ remaining: 99, reset: 1_710_000_000_000 })),
  RATE_LIMIT: 100,
}));

import { searchEntities } from '@/lib/query/search';
import { checkRateLimit } from '@/middleware/rate-limit';
import { GET } from '@/app/api/search/route';

interface SearchResponse {
  meta: {
    limit: number;
    query: string;
    type: 'player' | 'team' | 'season' | 'game' | 'award' | 'page' | null;
  };
  results: Array<{
    description: string | null;
    href: Route;
    type: 'player' | 'team' | 'season' | 'game' | 'award' | 'page';
    id: string;
    label: string;
  }>;
}

const searchEntitiesMock = vi.mocked(searchEntities);
const checkRateLimitMock = vi.mocked(checkRateLimit);

function createSearchRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/search?q=${encodeURIComponent(query)}`);
}

function createResult(
  overrides: Partial<SearchResponse['results'][number]> &
    Pick<SearchResponse['results'][number], 'id' | 'label'>
): SearchResponse['results'][number] {
  return {
    description: null,
    href: '/search' as Route,
    type: 'player',
    ...overrides,
  };
}

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockReturnValue(null);
  });

  it('returns empty results for short queries', async () => {
    const request = createSearchRequest('a');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.meta).toEqual({ limit: 8, query: 'a', type: null });
    expect(payload.results).toEqual([]);
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('trims query and returns search results', async () => {
    const expectedResults: SearchResponse['results'] = [
      createResult({
        id: 'jamesle01',
        label: 'LeBron James',
        href: '/players/j/jamesle01' as Route,
      }),
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('  james  ');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith('james', { limit: 8 });
    expect(payload.meta).toEqual({ limit: 8, query: 'james', type: null });
    expect(payload.results).toEqual(expectedResults);
  });

  it('returns rate limit response when blocked', async () => {
    checkRateLimitMock.mockReturnValue(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    );

    const request = createSearchRequest('james');
    const response = GET(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(429);
    expect(payload.error).toBe('Too many requests');
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('returns empty results for trimmed input below 2-character boundary', async () => {
    const request = createSearchRequest('  a  ');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.meta).toEqual({ limit: 8, query: 'a', type: null });
    expect(payload.results).toEqual([]);
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('executes search for exact 2-character query', async () => {
    const expectedResults: SearchResponse['results'] = [
      createResult({
        id: 'jamesle01',
        label: 'LeBron James',
        href: '/players/j/jamesle01' as Route,
      }),
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('ja');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith('ja', { limit: 8 });
    expect(payload.meta).toEqual({ limit: 8, query: 'ja', type: null });
    expect(payload.results).toEqual(expectedResults);
  });

  it('returns empty results when query parameter is missing', async () => {
    const request = new NextRequest('http://localhost/api/search');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.meta).toEqual({ limit: 8, query: '', type: null });
    expect(payload.results).toEqual([]);
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('returns empty results when query is only whitespace', async () => {
    const request = createSearchRequest('   ');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.meta).toEqual({ limit: 8, query: '', type: null });
    expect(payload.results).toEqual([]);
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('returns empty results when searchEntities returns empty array', async () => {
    searchEntitiesMock.mockReturnValue([]);

    const request = createSearchRequest('nonexistent');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith('nonexistent', { limit: 8 });
    expect(payload.meta).toEqual({ limit: 8, query: 'nonexistent', type: null });
    expect(payload.results).toEqual([]);
  });

  it('handles multiple search results', async () => {
    const expectedResults: SearchResponse['results'] = [
      createResult({
        id: 'jamesle01',
        label: 'LeBron James',
        href: '/players/j/jamesle01' as Route,
      }),
      createResult({
        id: 'jamesha02',
        label: 'Harden James',
        href: '/players/j/jamesha02' as Route,
      }),
      createResult({
        id: 'LAL',
        label: 'Los Angeles Lakers',
        href: '/teams/LAL' as Route,
        type: 'team',
      }),
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('james');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toEqual(expectedResults);
    expect(payload.results).toHaveLength(3);
  });

  it('returns team results', async () => {
    const expectedResults: SearchResponse['results'] = [
      createResult({
        id: 'LAL',
        label: 'Los Angeles Lakers',
        href: '/teams/LAL' as Route,
        type: 'team',
      }),
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('lakers');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toHaveLength(1);
    expect(payload.results[0]?.type).toBe('team');
  });

  it('returns player results', async () => {
    const expectedResults: SearchResponse['results'] = [
      createResult({
        id: 'jamesle01',
        label: 'LeBron James',
        href: '/players/j/jamesle01' as Route,
      }),
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('lebron');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toHaveLength(1);
    expect(payload.results[0]?.type).toBe('player');
  });

  it('handles long search queries', async () => {
    const longQuery = 'a'.repeat(100);
    searchEntitiesMock.mockReturnValue([]);

    const request = createSearchRequest(longQuery);
    const response = GET(request);
    await response.json();

    expect(searchEntitiesMock).toHaveBeenCalledWith(longQuery, { limit: 8 });
  });

  it('handles special characters in query', async () => {
    const specialQuery = "O'Neal";
    const expectedResults: SearchResponse['results'] = [
      createResult({
        id: 'onealsh01',
        label: "Shaquille O'Neal",
        href: '/players/o/onealsh01' as Route,
      }),
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest(specialQuery);
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith(specialQuery, { limit: 8 });
    expect(payload.results).toEqual(expectedResults);
  });

  it('passes a recognized type filter through to searchEntities', async () => {
    searchEntitiesMock.mockReturnValue([]);

    const request = new NextRequest('http://localhost/api/search?q=james&type=player');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith('james', { limit: 8, types: ['player'] });
    expect(payload.meta).toEqual({ limit: 8, query: 'james', type: 'player' });
  });

  it('includes explicit cache and rate-limit headers on successful responses', () => {
    searchEntitiesMock.mockReturnValue([]);

    const request = createSearchRequest('james');
    const response = GET(request);

    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1710000000');
  });

  it('returns a structured error response when search fails', async () => {
    searchEntitiesMock.mockImplementation(() => {
      throw new Error('boom');
    });

    const request = createSearchRequest('james');
    const response = GET(request);
    const payload = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(500);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(payload).toEqual({
      error: {
        code: 'search_failed',
        message: 'Search results are temporarily unavailable.',
      },
    });
  });

  it('returns 200 status for successful search', () => {
    searchEntitiesMock.mockReturnValue([
      createResult({
        id: 'jamesle01',
        label: 'LeBron James',
        href: '/players/j/jamesle01' as Route,
      }),
    ]);

    const request = createSearchRequest('james');
    const response = GET(request);

    expect(response.status).toBe(200);
  });

  it('returns 200 status for empty results', () => {
    const request = createSearchRequest('a');
    const response = GET(request);

    expect(response.status).toBe(200);
  });
});
