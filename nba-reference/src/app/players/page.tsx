import Link from "next/link";
import { getDb } from "@/lib/db";

export default function PlayersPage() {
  const players = getDb()
    .prepare(
      `SELECT bref_id, full_name, position, is_active
       FROM dim_player
       WHERE bref_id IS NOT NULL
       ORDER BY is_active DESC, full_name ASC
       LIMIT 400`,
    )
    .all() as Array<{
    bref_id: string;
    full_name: string;
    position: string | null;
    is_active: number;
  }>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Players</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#ece5d7]">
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Player</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Pos</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.bref_id} className={i % 2 === 0 ? "bg-white" : "bg-[#faf8f2]"}>
                <td className="border border-[#d2c8b3] px-2 py-1">
                  <Link className="text-[#0d4a8a] underline" href={`/players/${p.bref_id}`}>
                    {p.full_name}
                  </Link>
                </td>
                <td className="border border-[#d2c8b3] px-2 py-1">{p.position ?? "-"}</td>
                <td className="border border-[#d2c8b3] px-2 py-1">{p.is_active ? "Active" : "Retired"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
