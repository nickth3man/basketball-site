import Link from "next/link";
import { StatsTable } from "@/components/stats-table";
import {
  getGameById,
  getGameLineScore,
  getGamePlayerAdvancedBox,
  getGamePbpEvents,
  getGamePlayerBox,
  getGameTeamFourFactors,
  getTeamGameBox,
} from "@/lib/queries";
import { notFound } from "next/navigation";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = getGameById(id);
  if (!game) notFound();

  const box = getTeamGameBox(id);
  const players = getGamePlayerBox(id);
  const playerAdvanced = getGamePlayerAdvancedBox(id);
  const lineScore = getGameLineScore(id);
  const fourFactors = getGameTeamFourFactors(id);
  const pbp = getGamePbpEvents(id, 50);

  const awayTeam = String(game.away_abbrev ?? "");
  const homeTeam = String(game.home_abbrev ?? "");
  const awayPlayers = players.filter((p) => String(p.team) === awayTeam);
  const homePlayers = players.filter((p) => String(p.team) === homeTeam);
  const awayAdvanced = playerAdvanced.filter(
    (p) => String(p.team) === awayTeam,
  );
  const homeAdvanced = playerAdvanced.filter(
    (p) => String(p.team) === homeTeam,
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / <Link href="/games">Games</Link> /{" "}
        {game.game_id}
      </div>
      <h1 className="mb-2 text-3xl font-bold">
        {game.away_name} at {game.home_name}
      </h1>
      <p className="mb-4 text-sm text-muted-strong">
        {game.game_date} | Final: {game.away_abbrev} {game.away_score} -{" "}
        {game.home_abbrev} {game.home_score}
      </p>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Line Score by Period</h2>
        <StatsTable
          columns={[
            { key: "period", label: "Period", align: "right" },
            { key: "away", label: `${game.away_abbrev}`, align: "right" },
            { key: "home", label: `${game.home_abbrev}`, align: "right" },
          ]}
          rows={lineScore}
          initialSort="period"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Team Box Score</h2>
        <StatsTable
          columns={[
            { key: "team", label: "Team" },
            { key: "fgm", label: "FG", align: "right" },
            { key: "fga", label: "FGA", align: "right" },
            { key: "fg3m", label: "3P", align: "right" },
            { key: "fg3a", label: "3PA", align: "right" },
            { key: "ftm", label: "FT", align: "right" },
            { key: "fta", label: "FTA", align: "right" },
            { key: "reb", label: "REB", align: "right" },
            { key: "ast", label: "AST", align: "right" },
            { key: "pts", label: "PTS", align: "right" },
          ]}
          rows={box}
          initialSort="pts"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">Four Factors</h2>
        <StatsTable
          columns={[
            { key: "team", label: "Team" },
            { key: "efg_pct", label: "eFG%", align: "right" },
            { key: "tov_pct", label: "TOV%", align: "right" },
            { key: "orb_pct", label: "ORB%", align: "right" },
            { key: "drb_pct", label: "DRB%", align: "right" },
            { key: "ft_fga", label: "FT/FGA", align: "right" },
          ]}
          rows={fourFactors}
          initialSort="team"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{awayTeam} Player Box Score</h2>
        <StatsTable
          columns={[
            { key: "full_name", label: "Player" },
            { key: "starter", label: "GS", align: "right" },
            { key: "minutes_played", label: "MP", align: "right" },
            { key: "pts", label: "PTS", align: "right" },
            { key: "reb", label: "REB", align: "right" },
            { key: "ast", label: "AST", align: "right" },
            { key: "stl", label: "STL", align: "right" },
            { key: "blk", label: "BLK", align: "right" },
            { key: "plus_minus", label: "+/-", align: "right" },
          ]}
          rows={awayPlayers.map((p) => ({
            ...p,
            starter: Number(p.starter) === 1 ? "*" : "",
          }))}
          initialSort="pts"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{homeTeam} Player Box Score</h2>
        <StatsTable
          columns={[
            { key: "full_name", label: "Player" },
            { key: "starter", label: "GS", align: "right" },
            { key: "minutes_played", label: "MP", align: "right" },
            { key: "pts", label: "PTS", align: "right" },
            { key: "reb", label: "REB", align: "right" },
            { key: "ast", label: "AST", align: "right" },
            { key: "stl", label: "STL", align: "right" },
            { key: "blk", label: "BLK", align: "right" },
            { key: "plus_minus", label: "+/-", align: "right" },
          ]}
          rows={homePlayers.map((p) => ({
            ...p,
            starter: Number(p.starter) === 1 ? "*" : "",
          }))}
          initialSort="pts"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{awayTeam} Advanced Box</h2>
        <StatsTable
          columns={[
            { key: "full_name", label: "Player" },
            { key: "minutes_played", label: "MP", align: "right" },
            { key: "efg_pct", label: "eFG%", align: "right" },
            { key: "ts_pct", label: "TS%", align: "right" },
            { key: "tov_pct", label: "TOV%", align: "right" },
            { key: "game_score", label: "GmSc", align: "right" },
          ]}
          rows={awayAdvanced}
          initialSort="game_score"
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-bold">{homeTeam} Advanced Box</h2>
        <StatsTable
          columns={[
            { key: "full_name", label: "Player" },
            { key: "minutes_played", label: "MP", align: "right" },
            { key: "efg_pct", label: "eFG%", align: "right" },
            { key: "ts_pct", label: "TS%", align: "right" },
            { key: "tov_pct", label: "TOV%", align: "right" },
            { key: "game_score", label: "GmSc", align: "right" },
          ]}
          rows={homeAdvanced}
          initialSort="game_score"
        />
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Play-by-Play (Recent)</h2>
        <StatsTable
          columns={[
            { key: "period", label: "Q", align: "right" },
            { key: "pc_time_string", label: "Time" },
            { key: "visitor_description", label: `${game.away_abbrev} Event` },
            { key: "home_description", label: `${game.home_abbrev} Event` },
            { key: "score", label: "Score" },
          ]}
          rows={pbp}
          initialSort="period"
        />
      </section>
    </main>
  );
}
