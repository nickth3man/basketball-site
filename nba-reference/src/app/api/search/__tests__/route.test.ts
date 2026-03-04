import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

vi.mock('@/lib/query/search', () => ({
  searchEntities: vi.fn(),
}));

vi.mock('@/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

import { searchEntities } from '@/lib/query/search';
import { checkRateLimit } from '@/middleware/rate-limit';
import { GET } from '../route';

interface SearchResponse {
  results: Array<{ type: 'player' | 'team'; id: string; label: string }>;
}

const searchEntitiesMock = vi.mocked(searchEntities);
const checkRateLimitMock = vi.mocked(checkRateLimit);

function createSearchRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/search?q=${encodeURIComponent(query)}`);
}

describe('GET /api/search', () => {
  beforeEach(() => {
    checkRateLimitMock.mockReturnValue(null);
  });

  it('returns empty results for short queries', async () => {
    const request = createSearchRequest('a');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toEqual([]);
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('trims query and returns search results', async () => {
    const expectedResults: SearchResponse['results'] = [
      { type: 'player', id: 'jamesle01', label: 'LeBron James' },
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('  james  ');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith('james');
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

  it('returns empty results for missing query parameter', async () => {
    const request = new NextRequest('http://localhost/api/search');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toEqual([]);
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('returns empty results for empty string after trim', async () => {
    const request = createSearchRequest('   ');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toEqual([]);
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('processes query at exactly 2 character boundary', async () => {
    const expectedResults: SearchResponse['results'] = [
      { type: 'team', id: 'LAL', label: 'Los Angeles Lakers' },
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('LA');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith('LA');
    expect(payload.results).toEqual(expectedResults);
  });

  it('handles multi-word queries', async () => {
    const expectedResults: SearchResponse['results'] = [
      { type: 'player', id: 'jamesle01', label: 'LeBron James' },
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('LeBron James');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith('LeBron James');
    expect(payload.results).toEqual(expectedResults);
  });

  it('handles queries with special characters', async () => {
    const expectedResults: SearchResponse['results'] = [
      { type: 'player', id: 'onealsh01', label: "Shaquille O'Neal" },
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest("O'Neal");
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith("O'Neal");
    expect(payload.results).toEqual(expectedResults);
  });

  it('returns empty array for valid query with no matches', async () => {
    searchEntitiesMock.mockReturnValue([]);

    const request = createSearchRequest('xyz123nonexistent');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith('xyz123nonexistent');
    expect(payload.results).toEqual([]);
  });
});