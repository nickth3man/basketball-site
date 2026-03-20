import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Route } from 'next';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

vi.mock('@/lib/query/home', () => ({
  getHomeStandings: vi.fn(),
  getRecentGames: vi.fn(),
}));

vi.mock('@/lib/query/search', () => ({
  searchEntities: vi.fn(),
}));

vi.mock('@/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  extractClientIp: vi.fn(() => '127.0.0.1'),
  getRateLimitStatus: vi.fn(() => ({ remaining: 99, reset: 1_710_000_000_000 })),
  RATE_LIMIT: 100,
}));

import { getHomeStandings, getRecentGames } from '@/lib/query/home';
import { searchEntities } from '@/lib/query/search';
import { checkRateLimit } from '@/middleware/rate-limit';
import { GET } from '@/app/api/export/[type]/route';

const getHomeStandingsMock = vi.mocked(getHomeStandings);
const getRecentGamesMock = vi.mocked(getRecentGames);
const searchEntitiesMock = vi.mocked(searchEntities);
const checkRateLimitMock = vi.mocked(checkRateLimit);

function createExportRequest(pathname: string, acceptEncoding?: string): NextRequest {
  if (acceptEncoding === undefined) {
    return new NextRequest(`http://localhost${pathname}`);
  }

  return new NextRequest(`http://localhost${pathname}`, {
    headers: { 'accept-encoding': acceptEncoding },
  });
}

function createSearchResult(href: Route): {
  description: null;
  href: Route;
  id: string;
  label: string;
  type: 'player';
} {
  return {
    description: null,
    href,
    type: 'player' as const,
    id: 'jamesle01',
    label: 'LeBron James',
  };
}

describe('GET /api/export/[type]', () => {
  beforeEach(() => {
    checkRateLimitMock.mockReturnValue(null);
    getHomeStandingsMock.mockReturnValue([
      {
        season_id: '2024-25',
        bref_abbrev: 'LAL',
        w: 50,
        l: 32,
        n_rtg: 3.2,
        pace: 99.1,
      },
    ]);
    getRecentGamesMock.mockReturnValue([
      {
        game_id: '0022400001',
        game_date: '2025-01-01',
        home_abbrev: 'LAL',
        away_abbrev: 'BOS',
        home_score: 110,
        away_score: 105,
      },
    ]);
    searchEntitiesMock.mockReturnValue([createSearchResult('/players/j/jamesle01' as Route)]);
  });

  it('returns standings data', async () => {
    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(getHomeStandingsMock).toHaveBeenCalledWith(30);

    const csvBody = await response.text();
    expect(csvBody).toContain('"season_id","bref_abbrev","w","l","n_rtg","pace"');
    expect(csvBody).toContain('"2024-25","LAL","50","32","3.2","99.1"');
  });

  it('returns CSV content type', async () => {
    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('standings.csv');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1710000000');
  });

  it('uses trimmed query value for search export', async () => {
    const request = createExportRequest('/api/export/search?q=%20james%20');
    const params = Promise.resolve({ type: 'search' });
    const response = await GET(request, { params });

    expect(searchEntitiesMock).toHaveBeenCalledWith('james');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Disposition')).toContain('search.csv');
  });

  it('returns gzip response when accepted and payload is large', async () => {
    const largeAbbreviation = `TEAM-${'X'.repeat(1400)}`;
    getHomeStandingsMock.mockReturnValue([
      {
        season_id: '2024-25',
        bref_abbrev: largeAbbreviation,
        w: 50,
        l: 32,
        n_rtg: 3.2,
        pace: 99.1,
      },
    ]);

    const request = createExportRequest('/api/export/standings', 'gzip');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.headers.get('Content-Encoding')).toBe('gzip');
    expect(response.headers.get('Vary')).toBe('Accept-Encoding');
  });

  it('returns 400 for unsupported export type', async () => {
    const request = createExportRequest('/api/export/unknown');
    const params = Promise.resolve({ type: 'unknown' });
    const response = await GET(request, { params });
    const payload = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(400);
    expect(getHomeStandingsMock).not.toHaveBeenCalled();
    expect(payload).toEqual({
      error: {
        code: 'invalid_export_type',
        message: 'Invalid export type.',
      },
    });
  });

  it('returns rate limit response when blocked', async () => {
    checkRateLimitMock.mockReturnValue(
      NextResponse.json(
        {
          error: { code: 'rate_limited', message: 'Rate limit exceeded. Try again in 1 seconds.' },
        },
        { status: 429 }
      )
    );

    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.status).toBe(429);
    expect(getHomeStandingsMock).not.toHaveBeenCalled();
  });

  it('returns a structured error response when export generation fails', async () => {
    getHomeStandingsMock.mockImplementation(() => {
      throw new Error('db unavailable');
    });

    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });
    const payload = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(response.status).toBe(500);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(payload).toEqual({
      error: {
        code: 'export_failed',
        message: 'CSV export is temporarily unavailable.',
      },
    });
  });

  it('returns games data with correct headers', async () => {
    const request = createExportRequest('/api/export/games');
    const params = Promise.resolve({ type: 'games' });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(getRecentGamesMock).toHaveBeenCalledWith(100);
    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('games.csv');

    const csvBody = await response.text();
    expect(csvBody).toContain(
      '"game_id","game_date","home_abbrev","away_abbrev","home_score","away_score"'
    );
    expect(csvBody).toContain('"0022400001","2025-01-01","LAL","BOS","110","105"');
  });

  it('handles search export with empty query parameter', async () => {
    const request = createExportRequest('/api/export/search?q=');
    const params = Promise.resolve({ type: 'search' });
    const response = await GET(request, { params });

    expect(searchEntitiesMock).toHaveBeenCalledWith('');
    expect(response.status).toBe(200);
  });

  it('handles search export without query parameter', async () => {
    const request = createExportRequest('/api/export/search');
    const params = Promise.resolve({ type: 'search' });
    const response = await GET(request, { params });

    expect(searchEntitiesMock).toHaveBeenCalledWith('');
    expect(response.status).toBe(200);
  });

  it('does not gzip when payload is small', async () => {
    const request = createExportRequest('/api/export/standings', 'gzip');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.headers.get('Content-Encoding')).toBeNull();
    expect(response.headers.get('Vary')).toBe('Accept-Encoding');
  });

  it('does not gzip when client does not support gzip', async () => {
    const largeAbbreviation = `TEAM-${'X'.repeat(1400)}`;
    getHomeStandingsMock.mockReturnValue([
      {
        season_id: '2024-25',
        bref_abbrev: largeAbbreviation,
        w: 50,
        l: 32,
        n_rtg: 3.2,
        pace: 99.1,
      },
    ]);

    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.headers.get('Content-Encoding')).toBeNull();
    expect(response.headers.get('Content-Type')).toContain('text/csv; charset=utf-8');
  });

  it('handles empty results from standings query', async () => {
    getHomeStandingsMock.mockReturnValue([]);

    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    const csvBody = await response.text();
    // Empty CSV should still have no content
    expect(csvBody).toBe('');
  });

  it('handles empty results from games query', async () => {
    getRecentGamesMock.mockReturnValue([]);

    const request = createExportRequest('/api/export/games');
    const params = Promise.resolve({ type: 'games' });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    const csvBody = await response.text();
    expect(csvBody).toBe('');
  });

  it('handles empty results from search query', async () => {
    searchEntitiesMock.mockReturnValue([]);

    const request = createExportRequest('/api/export/search?q=nonexistent');
    const params = Promise.resolve({ type: 'search' });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    const csvBody = await response.text();
    expect(csvBody).toBe('');
  });

  it('supports gzip with deflate in accept-encoding', async () => {
    const largeAbbreviation = `TEAM-${'X'.repeat(1400)}`;
    getHomeStandingsMock.mockReturnValue([
      {
        season_id: '2024-25',
        bref_abbrev: largeAbbreviation,
        w: 50,
        l: 32,
        n_rtg: 3.2,
        pace: 99.1,
      },
    ]);

    const request = createExportRequest('/api/export/standings', 'deflate, gzip, br');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.headers.get('Content-Encoding')).toBe('gzip');
    expect(response.headers.get('Vary')).toBe('Accept-Encoding');
  });

  it('handles multiple standings entries', async () => {
    getHomeStandingsMock.mockReturnValue([
      {
        season_id: '2024-25',
        bref_abbrev: 'LAL',
        w: 50,
        l: 32,
        n_rtg: 3.2,
        pace: 99.1,
      },
      {
        season_id: '2024-25',
        bref_abbrev: 'BOS',
        w: 48,
        l: 34,
        n_rtg: 2.8,
        pace: 98.5,
      },
    ]);

    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    const csvBody = await response.text();
    expect(csvBody).toContain('"LAL"');
    expect(csvBody).toContain('"BOS"');
  });

  it('returns charset in Content-Type header', async () => {
    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
  });
});
