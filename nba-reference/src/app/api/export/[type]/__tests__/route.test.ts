import { describe, it, expect } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

describe("GET /api/export/[type]", () => {
  it("returns standings data", async () => {
    const req = new NextRequest("http://localhost/api/export/standings");
    const params = Promise.resolve({ type: "standings" });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);
  });
});
