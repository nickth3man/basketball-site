import { searchEntities } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  return NextResponse.json({ results: searchEntities(q) });
}
