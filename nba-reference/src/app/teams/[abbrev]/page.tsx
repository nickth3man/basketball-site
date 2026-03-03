/**
 * @fileoverview Team detail page - comprehensive team statistics dashboard.
 * 
 * Displays team information including:
 * - Team profile (name, conference, division, arena, record)
 * - Per-game averages (PTS, REB, AST, STL, BLK, TOV, etc.)
 * - Recent games with W/L results
 * - Current roster with player stats
 * - Four Factors comparison (team vs opponent)
 * - Season-by-season team statistics
 * - Player statistical leaders
 * 
 * Uses sticky sidebar navigation for easy section access.
 * 
 * @module @/app/teams/[abbrev]/page
 */

import Link from "next/link";
import { StatsTable } from "@/components/stats-table";
import {
  getTeamByAbbrev,
  getTeamCurrentSeasonSummary,
  getTeamFourFactorsComparison,
  getTeamPerGameAverages,
  getTeamPlayerLeaders,
  getTeamRecentGames,
  getTeamRosterWithStats,
  getTeamSeasonStats,
} from "@/lib/queries";
import { formatSignedNumber } from "@/lib/formatters";
import { notFound } from "next/navigation";

/**
 * Render the team detail dashboard for the team identified by the route abbreviation.
 *
 * @param params - Promise resolving to route params containing the `abbrev` route parameter
 * @returns The JSX element for the team's detail page
 */
export default async function TeamPage({
  params,
}: {
  params: Promise<{ abbrev: string }>;
}) {
  const { abbrev } = await params;
  
  // Primary team lookup - normalize to uppercase for matching
  const team = getTeamByAbbrev(abbrev.toUpperCase());
  if (!team) notFound();

  // Fetch all team data in parallel
  const roster = getTeamRosterWithStats(team.team_id);
  const seasonStats = getTeamSeasonStats(team.abbreviation);
  const current = getTeamCurrentSeasonSummary(team.abbreviation);
  const fourFactors = getTeamFourFactorsComparison(team.abbreviation);
  const recentGames = getTeamRecentGames(team.team_id, 20);
  const averages = getTeamPerGameAverages(team.team_id);
  const leaders = getTeamPlayerLeaders(team.team_id, 12);

  // Determine which season label to display
  const seasonLabel =
    current?.season_id ?? seasonStats[0]?.season_id ?? "Current";

  // Navigation anchors for sticky sidebar
  const anchors = [
    { id: "summary", label: "Summary" },
    { id: "recent-games", label: "Recent Games" },
    { id: "roster", label: "Roster" },
    { id: "four-factors", label: "Four Factors" },
    { id: "team-stats", label: "Team Stats" },
    { id: "leaders", label: "Player Leaders" },
    { id: "history", label: "Season History" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb navigation */}
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/teams">Teams</Link> /{" "}
        {team.abbreviation}
      </div>

      {/* Team profile header */}
      <section
        id="summary"
        className="mb-5 border border-line bg-paper-soft p-4"
      >
        <div className="mb-2 text-xs text-crumb">
          {seasonLabel} Team Profile
        </div>
        <h1 className="mb-2 text-3xl font-bold">{team.full_name}</h1>

        {/* Team metadata grid */}
        <div className="grid gap-2 text-sm text-muted-strong md:grid-cols-3">
          <div>Conference: {team.conference ?? "-"}</div>
          <div>Division: {team.division ?? "-"}</div>
          <div>Arena: {current?.arena ?? team.arena_name ?? "-"}</div>
          <div>
            Record: {current?.w ?? "-"}-{current?.l ?? "-"}
          </div>
          <div>
            Net Rtg: {formatSignedNumber(current?.n_rtg as number | null)}
          </div>
          <div>Pace: {current?.pace ?? "-"}</div>
          <div>Off Rtg: {current?.o_rtg ?? "-"}</div>
          <div>Def Rtg: {current?.d_rtg ?? "-"}</div>
          <div>SRS: {formatSignedNumber(current?.srs as number | null)}</div>
        </div>

        {/* Per-game averages display */}
        {averages ? (
          <div className="mt-3 grid gap-2 border border-line-soft bg-white p-3 text-xs sm:grid-cols-5 lg:grid-cols-10">
            <div>
              PTS/G:{" "}
              <span className="font-bold tabular-nums">
                {averages.pts ?? "-"}
              </span>
            </div>
            <div>
              REB/G:{" "}
              <span className="font-bold tabular-nums">
                {averages.reb ?? "-"}
              </span>
            </div>
            <div>
              AST/G:{" "}
              <span className="font-bold tabular-nums">
                {averages.ast ?? "-"}
              </span>
            </div>
            <div>
              STL/G:{" "}
              <span className="font-bold tabular-nums">
                {averages.stl ?? "-"}
              </span>
            </div>
            <div>
              BLK/G:{" "}
              <span className="font-bold tabular-nums">
                {averages.blk ?? "-"}
              </span>
            </div>
            <div>
              TOV/G:{" "}
              <span className="font-bold tabular-nums">
                {averages.tov ?? "-"}
              </span>
            </div>
            <div>
              3PM/G:{" "}
              <span className="font-bold tabular-nums">
                {averages.fg3m ?? "-"}
              </span>
            </div>
            <div>
              3PA/G:{" "}
              <span className="font-bold tabular-nums">
                {averages.fg3a ?? "-"}
              </span>
            </div>
            <div>
              FG%:{" "}
              <span className="font-bold tabular-nums">
                {averages.fg_pct ?? "-"}
              </span>
            </div>
            <div>
              FT%:{" "}
              <span className="font-bold tabular-nums">
                {averages.ft_pct ?? "-"}
              </span>
            </div>
          </div>
        ) : null}
      </section>

      {/* Main content with sticky sidebar */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sticky navigation sidebar */}
        <aside className="h-max border border-line-mid bg-white p-3 lg:sticky lg:top-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-crumb">
            On this page
          </div>
          <nav className="space-y-1 text-sm">
            {anchors.map((a) => (
              <a
                key={a.id}
                href={`#${a.id}`}
                className="block rounded px-2 py-1 hover:bg-nav-hover"
              >
                {a.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Statistics sections */}
        <div className="space-y-8">
          {/* Recent Games */}
          <section id="recent-games">
            <h2 className="mb-2 text-xl font-bold">Recent Games</h2>
            <StatsTable
              columns={[
                { key: "game_date", label: "Date" },
                { key: "result", label: "W/L" },
                { key: "opp_abbrev", label: "Opp" },
                { key: "is_home", label: "Site" },
                { key: "team_score", label: "Team", align: "right" },
                { key: "opp_score", label: "Opp", align: "right" },
                { key: "game_id", label: "Game ID" },
              ]}
              rows={recentGames.map((r) => ({
                ...r,
                is_home: Number(r.is_home) === 1 ? "Home" : "Away",
              }))}
              initialSort="game_date"
            />
          </section>

          {/* Current Roster */}
          <section id="roster">
            <h2 className="mb-2 text-xl font-bold">Roster</h2>
            <StatsTable
              columns={[
                { key: "full_name", label: "Player" },
                { key: "position", label: "Pos" },
                { key: "g", label: "G", align: "right" },
                { key: "pts_pg", label: "PTS", align: "right" },
                { key: "reb_pg", label: "REB", align: "right" },
                { key: "ast_pg", label: "AST", align: "right" },
                { key: "height_cm", label: "Height (cm)", align: "right" },
                { key: "weight_kg", label: "Weight (kg)", align: "right" },
                { key: "birth_date", label: "Birth Date" },
              ]}
              rows={roster}
              initialSort="pts_pg"
            />
          </section>

          {/* Four Factors Comparison */}
          <section id="four-factors">
            <h2 className="mb-2 text-xl font-bold">
              Four Factors (Team vs Opponent)
            </h2>
            <StatsTable
              columns={[
                { key: "side", label: "Side" },
                { key: "efg_pct", label: "eFG%", align: "right" },
                { key: "tov_pct", label: "TOV%", align: "right" },
                { key: "orb_pct", label: "ORB%", align: "right" },
                { key: "ft_fga", label: "FT/FGA", align: "right" },
              ]}
              rows={
                fourFactors
                  ? [
                      {
                        side: "Team",
                        efg_pct: fourFactors.e_fg_pct,
                        tov_pct: fourFactors.tov_pct,
                        orb_pct: fourFactors.orb_pct,
                        ft_fga: fourFactors.ft_fga,
                      },
                      {
                        side: "Opponent",
                        efg_pct: fourFactors.opp_e_fg_pct,
                        tov_pct: fourFactors.opp_tov_pct,
                        // Calculate opponent ORB% from team DRB%
                        orb_pct:
                          fourFactors.drb_pct == null
                            ? null
                            : Number(100) - Number(fourFactors.drb_pct),
                        ft_fga: fourFactors.opp_ft_fga,
                      },
                    ]
                  : []
              }
              initialSort="side"
            />
          </section>

          {/* Team Season Stats */}
          <section id="team-stats">
            <h2 className="mb-2 text-xl font-bold">Team Misc / Efficiency</h2>
            <StatsTable
              columns={[
                { key: "season_id", label: "Season" },
                { key: "w", label: "W", align: "right" },
                { key: "l", label: "L", align: "right" },
                { key: "mov", label: "MOV", align: "right" },
                { key: "srs", label: "SRS", align: "right" },
                { key: "o_rtg", label: "ORtg", align: "right" },
                { key: "d_rtg", label: "DRtg", align: "right" },
                { key: "n_rtg", label: "NRtg", align: "right" },
                { key: "pace", label: "Pace", align: "right" },
                { key: "ts_pct", label: "TS%", align: "right" },
                { key: "e_fg_pct", label: "eFG%", align: "right" },
                { key: "tov_pct", label: "TOV%", align: "right" },
              ]}
              rows={seasonStats}
              initialSort="season_id"
            />
          </section>

          {/* Player Leaders */}
          <section id="leaders">
            <h2 className="mb-2 text-xl font-bold">
              Player Leaders (Current Season)
            </h2>
            <StatsTable
              columns={[
                { key: "full_name", label: "Player" },
                { key: "g", label: "G", align: "right" },
                { key: "pts_pg", label: "PTS", align: "right" },
                { key: "reb_pg", label: "REB", align: "right" },
                { key: "ast_pg", label: "AST", align: "right" },
                { key: "pts", label: "Tot PTS", align: "right" },
              ]}
              rows={leaders}
              initialSort="pts_pg"
            />
          </section>

          {/* Season History */}
          <section id="history">
            <h2 className="mb-2 text-xl font-bold">Season History</h2>
            <StatsTable
              columns={[
                { key: "season_id", label: "Season" },
                { key: "w", label: "W", align: "right" },
                { key: "l", label: "L", align: "right" },
                { key: "o_rtg", label: "ORtg", align: "right" },
                { key: "d_rtg", label: "DRtg", align: "right" },
                { key: "n_rtg", label: "NRtg", align: "right" },
                { key: "pace", label: "Pace", align: "right" },
              ]}
              rows={seasonStats}
              initialSort="season_id"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
