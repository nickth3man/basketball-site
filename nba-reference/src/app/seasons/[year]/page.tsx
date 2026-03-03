import Link from "next/link";
import { StatsTable } from "@/components/stats-table";
import {
  getSeasonAssistLeaders,
  getSeasonLeagueSummary,
  getSeasonRecentGames,
  getSeasonReboundLeaders,
  getSeasonScoringLeaders,
  getSeasonStandings,
} from "@/lib/queries";
import { notFound } from "next/navigation";

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const standings = getSeasonStandings(year);
  if (standings.length === 0) notFound();

  const leaders = getSeasonScoringLeaders(year, 30);
  const reboundLeaders = getSeasonReboundLeaders(year, 30);
  const assistLeaders = getSeasonAssistLeaders(year, 30);
  const leagueSummary = getSeasonLeagueSummary(year);
  const games = getSeasonRecentGames(year, 50);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/seasons">Seasons</Link> / {year}
      </div>
      <h1 className="mb-3 text-3xl font-bold">{year} NBA Season</h1>

      <section className="mb-8 border border-line-mid bg-paper-soft p-3 text-sm">
        <h2 className="mb-2 text-lg font-bold">League Summary</h2>
        <div className="grid gap-2 sm:grid-cols-5">
          <div>PPG: <span className="font-bold tabular-nums">{leagueSummary.ppg ?? "-"}</span></div>
          <div>RPG: <span className="font-bold tabular-nums">{leagueSummary.rpg ?? "-"}</span></div>
          <div>APG: <span className="font-bold tabular-nums">{leagueSummary.apg ?? "-"}</span></div>
          <div>eFG%: <span className="font-bold tabular-nums">{leagueSummary.efg_pct ?? "-"}</span></div>
          <div>TS%: <span className="font-bold tabular-nums">{leagueSummary.ts_pct ?? "-"}</span></div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Standings</h2>
        <StatsTable
          columns={[
            { key: "bref_abbrev", label: "Team" },
            { key: "w", label: "W", align: "right" },
            { key: "l", label: "L", align: "right" },
            { key: "srs", label: "SRS", align: "right" },
            { key: "o_rtg", label: "ORtg", align: "right" },
            { key: "d_rtg", label: "DRtg", align: "right" },
            { key: "n_rtg", label: "NRtg", align: "right" },
            { key: "pace", label: "Pace", align: "right" },
          ]}
          rows={standings}
          initialSort="w"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Scoring Leaders</h2>
        <StatsTable
          columns={[
            { key: "full_name", label: "Player" },
            { key: "team", label: "Tm" },
            { key: "g", label: "G", align: "right" },
            { key: "pts_pg", label: "PTS", align: "right" },
            { key: "pts", label: "Total PTS", align: "right" },
          ]}
          rows={leaders}
          initialSort="pts_pg"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Rebound Leaders</h2>
        <StatsTable
          columns={[
            { key: "full_name", label: "Player" },
            { key: "team", label: "Tm" },
            { key: "g", label: "G", align: "right" },
            { key: "reb_pg", label: "REB", align: "right" },
            { key: "reb", label: "Total REB", align: "right" },
          ]}
          rows={reboundLeaders}
          initialSort="reb_pg"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Assist Leaders</h2>
        <StatsTable
          columns={[
            { key: "full_name", label: "Player" },
            { key: "team", label: "Tm" },
            { key: "g", label: "G", align: "right" },
            { key: "ast_pg", label: "AST", align: "right" },
            { key: "ast", label: "Total AST", align: "right" },
          ]}
          rows={assistLeaders}
          initialSort="ast_pg"
        />
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Recent Games</h2>
        <StatsTable
          columns={[
            { key: "game_date", label: "Date" },
            { key: "away_abbrev", label: "Away" },
            { key: "away_score", label: "Away PTS", align: "right" },
            { key: "home_abbrev", label: "Home" },
            { key: "home_score", label: "Home PTS", align: "right" },
            { key: "game_id", label: "Game ID" },
          ]}
          rows={games}
          initialSort="game_date"
        />
      </section>
    </main>
  );
}
