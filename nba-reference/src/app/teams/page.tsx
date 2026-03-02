import Link from "next/link";
import { getDb } from "@/lib/db";

export default function TeamsPage() {
  const teams = getDb()
    .prepare(
      `SELECT abbreviation, full_name, conference, division
       FROM dim_team
       ORDER BY full_name ASC`,
    )
    .all() as Array<{
    abbreviation: string;
    full_name: string;
    conference: string | null;
    division: string | null;
  }>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Teams</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#ece5d7]">
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Team</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Conf</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Div</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr key={t.abbreviation} className={i % 2 === 0 ? "bg-white" : "bg-[#faf8f2]"}>
                <td className="border border-[#d2c8b3] px-2 py-1">
                  <Link className="text-[#0d4a8a] underline" href={`/teams/${t.abbreviation}`}>
                    {t.full_name} ({t.abbreviation})
                  </Link>
                </td>
                <td className="border border-[#d2c8b3] px-2 py-1">{t.conference ?? "-"}</td>
                <td className="border border-[#d2c8b3] px-2 py-1">{t.division ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
