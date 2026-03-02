import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { StatsTable } from "@/components/stats-table";
import { getHomeStandings, getLatestSeasonId, getRecentGames } from "@/lib/db";

export default function Home() {
  const seasonId = getLatestSeasonId();
  const standings = getHomeStandings(30);
  const games = getRecentGames(12);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-[#2b261f]">Basketball Stats and History</h1>
      <p className="mb-5 text-sm text-[#574f3f]">Season {seasonId} standings, scores, and player/team lookup.</p>

      <div className="mb-6 grid gap-3 md:grid-cols-[2fr_1fr]">
        <SearchBox />
        <div className="flex items-center gap-2 text-sm">
          <Link href="/api/export/standings" className="rounded border border-[#b8ab8f] bg-[#f6f3ea] px-2 py-2 hover:bg-[#ece5d7]">Export Standings</Link>
          <Link href="/api/export/games" className="rounded border border-[#b8ab8f] bg-[#f6f3ea] px-2 py-2 hover:bg-[#ece5d7]">Export Games</Link>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold text-[#2b261f]">{seasonId} NBA Standings</h2>
        <StatsTable
          columns={[
            { key: "bref_abbrev", label: "Team" },
            { key: "w", label: "W", align: "right" },
            { key: "l", label: "L", align: "right" },
            { key: "n_rtg", label: "NetRtg", align: "right" },
            { key: "pace", label: "Pace", align: "right" },
          ]}
          rows={standings}
          initialSort="w"
        />
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-[#2b261f]">Recent Games</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#ece5d7]">
                {[
                  "Date",
                  "Away",
                  "Away PTS",
                  "Home",
                  "Home PTS",
                  "Box Score",
                ].map((h) => (
                  <th key={h} className="border border-[#b8ab8f] px-2 py-1 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.map((g, i) => (
                <tr key={g.game_id} className={i % 2 === 0 ? "bg-white" : "bg-[#faf8f2]"}>
                  <td className="border border-[#d2c8b3] px-2 py-1">{g.game_date}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1">{g.away_abbrev}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right">{g.away_score ?? "-"}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1">{g.home_abbrev}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1 text-right">{g.home_score ?? "-"}</td>
                  <td className="border border-[#d2c8b3] px-2 py-1">
                    <Link className="text-[#0d4a8a] underline" href={`/games/${g.game_id}`}>
                      Box Score
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
