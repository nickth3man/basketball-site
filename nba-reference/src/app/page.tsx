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
      <h1 className="fade-slide-in mb-1 text-3xl font-bold text-[var(--heading)]">Basketball Stats and History</h1>
      <p className="fade-slide-in mb-5 text-sm text-[var(--muted)]" style={{ animationDelay: "80ms" }}>
        Season {seasonId} standings, scores, and player/team lookup.
      </p>

      <div className="fade-slide-in mb-6 grid gap-3 md:grid-cols-[2fr_1fr]" style={{ animationDelay: "140ms" }}>
        <SearchBox />
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/api/export/standings"
            className="rounded border border-[var(--line)] bg-[var(--button-bg)] px-2 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--button-hover)] active:translate-y-0 active:scale-[0.98]"
          >
            Export Standings
          </Link>
          <Link
            href="/api/export/games"
            className="rounded border border-[var(--line)] bg-[var(--button-bg)] px-2 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--button-hover)] active:translate-y-0 active:scale-[0.98]"
          >
            Export Games
          </Link>
        </div>
      </div>

      <section className="fade-slide-in panel-paper mb-8 p-3" style={{ animationDelay: "200ms" }}>
        <h2 className="mb-2 text-xl font-bold text-[var(--heading)]">{seasonId} NBA Standings</h2>
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

      <section className="fade-slide-in panel-paper p-3" style={{ animationDelay: "260ms" }}>
        <h2 className="mb-2 text-xl font-bold text-[var(--heading)]">Recent Games</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--thead)]">
                {[
                  "Date",
                  "Away",
                  "Away PTS",
                  "Home",
                  "Home PTS",
                  "Box Score",
                ].map((h) => (
                  <th key={h} className="border border-[var(--line)] px-2 py-1 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.map((g, i) => (
                <tr
                  key={g.game_id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-[var(--row-alt)]"} transition-colors duration-200 hover:bg-[var(--row-hover)]`}
                >
                  <td className="border border-[var(--line-soft)] px-2 py-1">{g.game_date}</td>
                  <td className="border border-[var(--line-soft)] px-2 py-1">{g.away_abbrev}</td>
                  <td className="border border-[var(--line-soft)] px-2 py-1 text-right">{g.away_score ?? "-"}</td>
                  <td className="border border-[var(--line-soft)] px-2 py-1">{g.home_abbrev}</td>
                  <td className="border border-[var(--line-soft)] px-2 py-1 text-right">{g.home_score ?? "-"}</td>
                  <td className="border border-[var(--line-soft)] px-2 py-1">
                    <Link className="text-[var(--link)] underline decoration-transparent transition-all duration-200 hover:decoration-current" href={`/games/${g.game_id}`}>
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
