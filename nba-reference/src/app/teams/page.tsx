/**
 * @fileoverview Teams directory page - lists all NBA teams.
 * 
 * Displays a list of all NBA teams with:
 * - Team name and abbreviation
 * - Conference (East/West)
 * - Division
 * 
 * Teams are sorted alphabetically by full name.
 * 
 * @module @/app/teams/page
 */

import Link from "next/link";
import { getTeamDirectory } from "@/lib/query/directory";
import {
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from "@/lib/table-styles";

/**
 * Teams directory page component.
 * 
 * Fetches all teams from the directory query and displays
 * them in a simple table format with links to detail pages.
 * 
 * @returns Teams directory page JSX
 */
export default function TeamsPage() {
  const teams = getTeamDirectory();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-3 text-2xl font-bold">Teams</h1>
      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass("left")}>Team</th>
              <th className={tableHeaderCellClass("left")}>Conf</th>
              <th className={tableHeaderCellClass("left")}>Div</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr
                key={t.abbreviation}
                className={i % 2 === 0 ? "bg-white" : "bg-row-alt"}
              >
                <td className={tableCellClass("left")}>
                  <Link
                    className={tableLinkClass}
                    href={`/teams/${t.abbreviation}`}
                  >
                    {t.full_name} ({t.abbreviation})
                  </Link>
                </td>
                <td className={tableCellClass("left")}>
                  {t.conference ?? "-"}
                </td>
                <td className={tableCellClass("left")}>{t.division ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
