/**
 * @fileoverview Unit tests for the search API route.
 *
 * Tests the GET handler for /api/search:
 * - Short query validation (returns empty for < 2 chars)
 * - Valid query handling (returns results array)
 *
 * @module @/app/api/search/__tests__/route.test
 */

import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/search', () => {
  /**
   * Verifies that queries shorter than 2 characters return empty results.
   * This prevents unnecessary database queries for single characters.
   */
  it('returns empty results for short queries', async () => {
    const req = new NextRequest('http://localhost/api/search?q=a');
    const res = await GET(req);
    const json = await res.json();
    expect(json.results).toEqual([]);
  });

  /**
   * Verifies that valid queries return an array of results.
   * The actual content depends on the database state.
   */
  it('returns results for valid query', async () => {
    const req = new NextRequest('http://localhost/api/search?q=james');
    const res = await GET(req);
    const json = await res.json();
    expect(Array.isArray(json.results)).toBe(true);
  });
});
