/**
 * @fileoverview Unit tests for the CSV export API route.
 * 
 * Tests the GET handler for /api/export/{type}:
 * - Standings export returns successful response
 * - CSV content type headers are set correctly
 * 
 * @module @/app/api/export/[type]/__tests__/route.test
 */

import { describe, it, expect } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

describe("GET /api/export/[type]", () => {
  /**
   * Verifies that the standings export endpoint returns a successful response.
   * Checks for 200 status code.
   */
  it("returns standings data", async () => {
    const req = new NextRequest("http://localhost/api/export/standings");
    const params = Promise.resolve({ type: "standings" });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);
  });

  /**
   * Verifies that the response includes proper CSV content type headers.
   */
  it("returns CSV content type", async () => {
    const req = new NextRequest("http://localhost/api/export/standings");
    const params = Promise.resolve({ type: "standings" });
    const res = await GET(req, { params });
    expect(res.headers.get("Content-Type")).toContain("text/csv");
  });

  /**
   * Verifies that the response includes content disposition for download.
   */
  it("returns content disposition header", async () => {
    const req = new NextRequest("http://localhost/api/export/standings");
    const params = Promise.resolve({ type: "standings" });
    const res = await GET(req, { params });
    const disposition = res.headers.get("Content-Disposition");
    expect(disposition).toContain("attachment");
    expect(disposition).toContain("standings.csv");
  });
});
