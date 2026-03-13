import type React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import type { AllTeamHistoryRow } from '@/lib/queries/awards';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

function PlayerLink({ brefId, fullName }: { brefId: string; fullName: string }): React.JSX.Element {
  return (
    <Link
      href={`/players/${brefId.slice(0, 1).toLowerCase()}/${brefId}` as Route}
      className={tableLinkClass}
    >
      {fullName}
    </Link>
  );
}

function TeamLink({ teamAbbrev }: { teamAbbrev: string | null }): React.JSX.Element {
  if (teamAbbrev == null) {
    return <>{'-'}</>;
  }

  return (
    <Link href={`/teams/${teamAbbrev}` as Route} className={tableLinkClass}>
      {teamAbbrev}
    </Link>
  );
}

export function AllDefenseSelectionsTable({
  selections,
}: {
  selections: AllTeamHistoryRow[];
}): React.JSX.Element {
  return (
    <div className={tableContainerClass}>
      <table className={tableClass}>
        <thead>
          <tr className={tableHeadRowClass}>
            <th className={tableHeaderCellClass('left')}>Season</th>
            <th className={tableHeaderCellClass('left')}>Team</th>
            <th className={tableHeaderCellClass('left')}>Position</th>
            <th className={tableHeaderCellClass('left')}>Player</th>
            <th className={tableHeaderCellClass('left')}>NBA Team</th>
          </tr>
        </thead>
        <tbody>
          {selections.map((selection, index) => (
            <tr
              key={`${selection.season_id}-${selection.team_number}-${selection.position}-${selection.bref_id}`}
              className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
            >
              <td className={tableCellClass('left')}>
                {selection.start_year}-{selection.end_year}
              </td>
              <td className={tableCellClass('left')}>
                <span className="font-medium">{selection.team_name}</span>
              </td>
              <td className={tableCellClass('left')}>{selection.position}</td>
              <td className={tableCellClass('left')}>
                <PlayerLink brefId={selection.bref_id} fullName={selection.full_name} />
              </td>
              <td className={tableCellClass('left')}>
                <TeamLink teamAbbrev={selection.team_abbrev} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
