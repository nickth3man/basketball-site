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

  it('returns empty results for exact 2-character boundary after trimming', async () => {
    const request = createSearchRequest('  a  ');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toEqual([]);
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('executes search for exact 2-character query', async () => {
    const expectedResults: SearchResponse['results'] = [
      { type: 'player', id: 'jamesle01', label: 'LeBron James' },
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('ja');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith('ja');
    expect(payload.results).toEqual(expectedResults);
  });

  it('returns empty results when query parameter is missing', async () => {
    const request = new NextRequest('http://localhost/api/search');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toEqual([]);
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('returns empty results when query is only whitespace', async () => {
    const request = createSearchRequest('   ');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toEqual([]);
    expect(searchEntitiesMock).not.toHaveBeenCalled();
  });

  it('returns empty results when searchEntities returns empty array', async () => {
    searchEntitiesMock.mockReturnValue([]);

    const request = createSearchRequest('nonexistent');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith('nonexistent');
    expect(payload.results).toEqual([]);
  });

  it('handles multiple search results', async () => {
    const expectedResults: SearchResponse['results'] = [
      { type: 'player', id: 'jamesle01', label: 'LeBron James' },
      { type: 'player', id: 'jamesha02', label: 'Harden James' },
      { type: 'team', id: 'LAL', label: 'Los Angeles Lakers' },
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
      { type: 'team', id: 'LAL', label: 'Los Angeles Lakers' },
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('lakers');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toHaveLength(1);
    expect(payload.results[0].type).toBe('team');
  });

  it('returns player results', async () => {
    const expectedResults: SearchResponse['results'] = [
      { type: 'player', id: 'jamesle01', label: 'LeBron James' },
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest('lebron');
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results).toHaveLength(1);
    expect(payload.results[0].type).toBe('player');
  });

  it('handles long search queries', async () => {
    const longQuery = 'a'.repeat(100);
    searchEntitiesMock.mockReturnValue([]);

    const request = createSearchRequest(longQuery);
    const response = GET(request);
    await response.json();

    expect(searchEntitiesMock).toHaveBeenCalledWith(longQuery);
  });

  it('handles special characters in query', async () => {
    const specialQuery = "O'Neal";
    const expectedResults: SearchResponse['results'] = [
      { type: 'player', id: 'onealsh01', label: "Shaquille O'Neal" },
    ];
    searchEntitiesMock.mockReturnValue(expectedResults);

    const request = createSearchRequest(specialQuery);
    const response = GET(request);
    const payload = (await response.json()) as SearchResponse;

    expect(searchEntitiesMock).toHaveBeenCalledWith(specialQuery);
    expect(payload.results).toEqual(expectedResults);
  });

  it('returns 200 status for successful search', async () => {
    searchEntitiesMock.mockReturnValue([
      { type: 'player', id: 'jamesle01', label: 'LeBron James' },
    ]);

    const request = createSearchRequest('james');
    const response = GET(request);

    expect(response.status).toBe(200);
  });

  it('returns 200 status for empty results', async () => {
    const request = createSearchRequest('a');
    const response = GET(request);

    expect(response.status).toBe(200);
  });
});