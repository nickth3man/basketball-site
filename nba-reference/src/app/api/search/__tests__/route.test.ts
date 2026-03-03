import { describe, it, expect } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

describe("GET /api/search", () => {
  it("returns empty results for short queries", async () => {
    const req = new NextRequest("http://localhost/api/search?q=a");
    const res = await GET(req);
    const json = await res.json();
    expect(json.results).toEqual([]);
  });

  it("returns results for valid query", async () => {
    const req = new NextRequest("http://localhost/api/search?q=james");
    const res = await GET(req);
    const json = await res.json();
    expect(Array.isArray(json.results)).toBe(true);
  });
});
