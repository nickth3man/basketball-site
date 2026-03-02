import Link from "next/link";
import { getSeasons } from "@/lib/queries";

export default function SeasonsPage() {
  const seasons = getSeasons(40);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Seasons</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#ece5d7]">
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Season</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">Start</th>
              <th className="border border-[#b8ab8f] px-2 py-1 text-left">End</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((s, i) => (
              <tr key={s.season_id} className={i % 2 === 0 ? "bg-white" : "bg-[#faf8f2]"}>
                <td className="border border-[#d2c8b3] px-2 py-1">
                  <Link className="text-[#0d4a8a] underline" href={`/seasons/${s.season_id}`}>
                    {s.season_id}
                  </Link>
                </td>
                <td className="border border-[#d2c8b3] px-2 py-1">{s.start_year}</td>
                <td className="border border-[#d2c8b3] px-2 py-1">{s.end_year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
