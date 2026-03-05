import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getTodayBirthdays, getAllBirthdaysGrouped } from '@/lib/queries/frivolities';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BirthdaysPage(): React.JSX.Element {
  const today = new Date();
  const todayBirthdays = getTodayBirthdays();
  const allBirthdays = getAllBirthdaysGrouped();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">NBA Player Birthdays</h1>
      <p className="mb-5 text-sm text-muted">Find players by their birth date.</p>

      {todayBirthdays.length > 0 && (
        <section className="panel-paper mb-6 border-l-4 border-accent p-4">
          <h2 className="mb-3 text-xl font-bold text-heading">
            Today's Birthdays ({MONTH_NAMES[today.getMonth()]} {today.getDate()})
          </h2>
          <div className="flex flex-wrap gap-2">
            {todayBirthdays.map((player) => (
              <Link
                key={player['bref_id']}
                href={`/players/${(player['bref_id'] as string).slice(0, 1).toLowerCase()}/${player['bref_id']}` as Route}
                className="rounded bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/20"
              >
                {player['full_name'] as string}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="panel-paper p-4">
        <h2 className="mb-3 text-xl font-bold text-heading">All Birthdays by Date</h2>
        <div className={tableContainerClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeaderCellClass('left')}>Date</th>
                <th className={tableHeaderCellClass('left')}>Players</th>
              </tr>
            </thead>
            <tbody>
              {allBirthdays.slice(0, 50).map(({ month, day, players }, index) => (
                <tr
                  key={`${month}-${day}`}
                  className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>
                    {MONTH_NAMES[month - 1]} {day}
                  </td>
                  <td className={tableCellClass('left')}>
                    <div className="flex flex-wrap gap-1">
                      {players.slice(0, 5).map((player) => (
                        <Link
                          key={player['bref_id']}
                          href={`/players/${(player['bref_id'] as string).slice(0, 1).toLowerCase()}/${player['bref_id']}` as Route}
                          className={tableLinkClass}
                        >
                          {player['full_name']}
                        </Link>
                      ))}
                      {players.length > 5 && (
                        <span className="text-sm text-muted">+{players.length - 5} more</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
