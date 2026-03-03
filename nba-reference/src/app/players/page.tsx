import Link from "next/link";
import { getPlayerDirectory } from "@/lib/query/directory";
import {
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from "@/lib/table-styles";

export default function PlayersPage() {
  const players = getPlayerDirectory(400);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Players</h1>
      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass("left")}>Player</th>
              <th className={tableHeaderCellClass("left")}>Pos</th>
              <th className={tableHeaderCellClass("left")}>Status</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr
                key={p.bref_id}
                className={i % 2 === 0 ? "bg-white" : "bg-row-alt"}
              >
                <td className={tableCellClass("left")}>
                  <Link
                    className={tableLinkClass}
                    href={`/players/${p.bref_id}`}
                  >
                    {p.full_name}
                  </Link>
                </td>
                <td className={tableCellClass("left")}>{p.position ?? "-"}</td>
                <td className={tableCellClass("left")}>
                  {p.is_active ? "Active" : "Retired"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
