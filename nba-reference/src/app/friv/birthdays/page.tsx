import type React from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { PaginationNav } from '@/components/pagination-nav';
import { coercePageNumber, paginateItems } from '@/lib/pagination';
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
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default async function BirthdaysPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; page?: string }>;
}): Promise<React.JSX.Element> {
  const { month: monthParam, page } = await searchParams;
  const today = new Date();
  const todayBirthdays = getTodayBirthdays();
  const allBirthdays = getAllBirthdaysGrouped();
  const requestedMonth = Number.parseInt(monthParam ?? '', 10);
  const activeMonth =
    Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
      ? requestedMonth
      : undefined;
  const filteredBirthdays =
    activeMonth == null ? allBirthdays : allBirthdays.filter(group => group.month === activeMonth);
  const paginatedBirthdays = paginateItems(filteredBirthdays, coercePageNumber(page), 40);
  const summary =
    paginatedBirthdays.totalItems === 0
      ? 'No birthdays found for this month filter.'
      : `Showing ${paginatedBirthdays.startItem}-${paginatedBirthdays.endItem} of ${paginatedBirthdays.totalItems} birthday dates.`;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-3xl font-bold text-heading">NBA Player Birthdays</h1>
      <p className="mb-5 text-sm text-muted">
        Find players by their birth date and filter the calendar by month.
      </p>

      {todayBirthdays.length > 0 && (
        <section className="mb-6 panel-paper border-l-4 border-accent p-4">
          <h2 className="mb-3 text-xl font-bold text-heading">
            Today&apos;s Birthdays ({MONTH_NAMES[today.getMonth()]} {today.getDate()})
          </h2>
          <div className="flex flex-wrap gap-2">
            {todayBirthdays.map(player => (
              <Link
                key={player.bref_id}
                href={
                  `/players/${player.bref_id.slice(0, 1).toLowerCase()}/${player.bref_id}` as Route
                }
                className="rounded bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/20"
              >
                {player.full_name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="panel-paper p-4">
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Link
            href="/friv/birthdays"
            className={
              activeMonth == null
                ? 'rounded border border-line bg-paper-soft px-3 py-2 font-semibold text-heading'
                : 'rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover'
            }
          >
            All Months
          </Link>
          {MONTH_NAMES.map((name, index) => {
            const monthValue = index + 1;
            return (
              <Link
                key={name}
                href={`/friv/birthdays?month=${monthValue}` as Route}
                className={
                  activeMonth === monthValue
                    ? 'rounded border border-line bg-paper-soft px-3 py-2 font-semibold text-heading'
                    : 'rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover'
                }
              >
                {name}
              </Link>
            );
          })}
        </div>
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
              {paginatedBirthdays.items.map(({ month, day, players }, index) => (
                <tr
                  key={`${month}-${day}`}
                  className={index % 2 === 0 ? tableBodyRowClass : 'bg-row-alt'}
                >
                  <td className={tableCellClass('left')}>
                    {MONTH_NAMES[month - 1]} {day}
                  </td>
                  <td className={tableCellClass('left')}>
                    <div className="flex flex-wrap gap-1">
                      {players.slice(0, 5).map(player => (
                        <Link
                          key={player.bref_id}
                          href={
                            `/players/${player.bref_id.slice(0, 1).toLowerCase()}/${player.bref_id}` as Route
                          }
                          className={tableLinkClass}
                        >
                          {player.full_name}
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
        <PaginationNav
          currentPage={paginatedBirthdays.currentPage}
          pathname={'/friv/birthdays' as Route}
          query={{ month: activeMonth == null ? undefined : String(activeMonth) }}
          summary={summary}
          totalPages={paginatedBirthdays.totalPages}
        />
      </section>
    </main>
  );
}
