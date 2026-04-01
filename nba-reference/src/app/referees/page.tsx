/**
 * @fileoverview Referee index page - lists all referees with career game counts.
 *
 * Displays a paginated, alphabetical list of NBA referees.
 * Referee names link to their detail page at `/referees/[id]`.
 *
 * @module @/app/referees/page
 */

import type React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PaginationNav } from '@/components/pagination-nav';
import { coercePageNumber } from '@/lib/pagination';
import { getRefereeDirectory, getRefereeDirectoryCount } from '@/lib/queries/referees';
import { routes } from '@/lib/routes';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';

export const metadata: Metadata = {
  title: 'Referees | NBA Reference',
  description: 'Browse NBA referees and their career officiating statistics.',
};

interface RefereesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function RefereesPage({
  searchParams,
}: RefereesPageProps): Promise<React.JSX.Element> {
  const resolvedSearchParams = await searchParams;
  const requestedPage = coercePageNumber(resolvedSearchParams.page);
  const pageSize = 50;
  const total = getRefereeDirectoryCount();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const referees = getRefereeDirectory(pageSize, offset);

  const summary =
    total === 0
      ? 'No referees found.'
      : `Showing ${offset + 1}–${Math.min(offset + referees.length, total)} of ${total} referees.`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-1 text-xs text-crumb">
        <Link href="/">Home</Link> / Referees
      </div>
      <h1 className="mb-2 inscription-title text-2xl">NBA Referees</h1>
      <p className="mb-4 text-sm text-muted">
        Browse NBA officials and their career game counts. Click a referee name to view their full
        career profile.
      </p>

      <div className={tableContainerClass}>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeaderCellClass('left')}>Name</th>
              <th className={tableHeaderCellClass('right')}>Career Start</th>
              <th className={tableHeaderCellClass('right')}>Status</th>
              <th className={tableHeaderCellClass('right')}>Games</th>
            </tr>
          </thead>
          <tbody>
            {referees.map(ref => (
              <tr key={String(ref['referee_id'])} className={tableBodyRowClass}>
                <td className={tableCellClass('left')}>
                  <Link className={tableLinkClass} href={routes.referee(String(ref['referee_id']))}>
                    {String(ref['full_name'])}
                  </Link>
                </td>
                <td className={tableCellClass('right')}>{ref['career_start_year'] ?? '—'}</td>
                <td className={tableCellClass('right')}>
                  {Number(ref['active']) === 1 ? 'Active' : 'Retired'}
                </td>
                <td className={tableCellClass('right')}>{ref['games_total'] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationNav
        currentPage={currentPage}
        pathname={routes.referees()}
        summary={summary}
        totalPages={totalPages}
      />
    </main>
  );
}
