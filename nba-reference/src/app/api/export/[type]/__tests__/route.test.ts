import { beforeEach, describe, expect, it, vi } from 'vitest';
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
}));

import { getHomeStandings, getRecentGames } from '@/lib/query/home';
import { searchEntities } from '@/lib/query/search';
import { checkRateLimit } from '@/middleware/rate-limit';
import { GET } from '../route';

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
    searchEntitiesMock.mockReturnValue([
      {
        type: 'player',
        id: 'jamesle01',
        label: 'LeBron James',
      },
    ]);
  });

  it('returns standings data', async () => {
    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(getHomeStandingsMock).toHaveBeenCalledWith(30);

    const csvBody = await response.text();
    expect(csvBody).toContain('season_id,bref_abbrev,w,l,n_rtg,pace');
    expect(csvBody).toContain('"2024-25","LAL","50","32","3.2","99.1"');
  });

  it('returns CSV content type', async () => {
    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('standings.csv');
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

    expect(response.status).toBe(400);
    expect(getHomeStandingsMock).not.toHaveBeenCalled();
  });

  it('returns rate limit response when blocked', async () => {
    checkRateLimitMock.mockReturnValue(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    );

    const request = createExportRequest('/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.status).toBe(429);
    expect(getHomeStandingsMock).not.toHaveBeenCalled();
  });

  it('returns games data', async () => {
    const request = createExportRequest('/api/export/games');
    const params = Promise.resolve({ type: 'games' });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(getRecentGamesMock).toHaveBeenCalledWith(100);

    const csvBody = await response.text();
    expect(csvBody).toContain('game_id,game_date,home_abbrev,away_abbrev,home_score,away_score');
    expect(csvBody).toContain('"0022400001","2025-01-01","LAL","BOS","110","105"');
  });

  it('handles empty search query', async () => {
    searchEntitiesMock.mockReturnValue([]);

    const request = createExportRequest('/api/export/search?q=');
    const params = Promise.resolve({ type: 'search' });
    const response = await GET(request, { params });

    expect(searchEntitiesMock).toHaveBeenCalledWith('');
    expect(response.status).toBe(200);
  });

  it('does not use gzip for small payloads', async () => {
    const request = createExportRequest('/api/export/standings', 'gzip');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Encoding')).toBeNull();
    expect(response.headers.get('Vary')).toBeNull();
  });
});