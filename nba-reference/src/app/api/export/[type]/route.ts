import {
  getHomeStandings,
  getRecentGames,
} from "@/lib/query/home";
import { searchEntities } from "@/lib/query/search";
import { NextRequest } from "next/server";

function toCsv(rows: Array<Record<string, string | number | null>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const out = [headers.join(",")];

  for (const row of rows) {
    out.push(
      headers
        .map((h) => {
          const v = row[h];
          const str = v == null ? "" : String(v).replaceAll('"', '""');
          return `"${str}"`;
        })
        .join(","),
    );
  }

  return out.join("\n");
}

export function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  return params.then(({ type }) => {
    let rows: Array<Record<string, string | number | null>> = [];

    if (type === "standings") rows = getHomeStandings(30) as Array<Record<string, string | number | null>>;
    if (type === "games") rows = getRecentGames(100) as Array<Record<string, string | number | null>>;
    if (type === "search") {
      const q = req.nextUrl.searchParams.get("q") ?? "";
      rows = searchEntities(q) as Array<Record<string, string | number | null>>;
    }

    const csv = toCsv(rows);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}.csv"`,
      },
    });
  });
}
