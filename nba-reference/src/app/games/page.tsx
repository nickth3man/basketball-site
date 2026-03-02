import Link from "next/link";
import { getRecentGames } from "@/lib/db";

export default function GamesPage() {
  const games = getRecentGames(200);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Games</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#ece5d7]">
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Date</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Away</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-right">PTS</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Home</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-right">PTS</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Link</th>
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
                    Box
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
