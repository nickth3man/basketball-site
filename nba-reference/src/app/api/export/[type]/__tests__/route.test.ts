/**
 * @fileoverview Unit tests for the CSV export API route.
 *
 * Tests the GET handler for /api/export/{type}:
 * - Standings export returns successful response
 * - CSV content type headers are set correctly
 *
 * @module @/app/api/export/[type]/__tests__/route.test
 */

import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/export/[type]', () => {
  /**
   * Verifies that the standings export endpoint returns a successful response.
   * Checks for 200 status code.
   */
  it('returns standings data', async () => {
    const request = new NextRequest('http://localhost/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });
    expect(response.status).toBe(200);
  });

  /**
   * Verifies that the response includes proper CSV content type headers.
   */
  it('returns CSV content type', async () => {
    const request = new NextRequest('http://localhost/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });
    expect(response.headers.get('Content-Type')).toContain('text/csv');
  });

  /**
   * Verifies that the response includes content disposition for download.
   */
  it('returns content disposition header', async () => {
    const request = new NextRequest('http://localhost/api/export/standings');
    const params = Promise.resolve({ type: 'standings' });
    const response = await GET(request, { params });
    const disposition = response.headers.get('Content-Disposition');
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('standings.csv');
  });

  it('returns 400 for unsupported export type', async () => {
    const request = new NextRequest('http://localhost/api/export/unknown');
    const params = Promise.resolve({ type: 'unknown' });
    const response = await GET(request, { params });
    expect(response.status).toBe(400);
  });
});
