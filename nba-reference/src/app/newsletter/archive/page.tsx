/**
 * @fileoverview Newsletter archive page — lists all sent newsletter editions.
 *
 * Renders a paginated list of past newsletter editions with date and subject
 * line. Each row links to the individual edition. When no editions have been
 * sent yet, a friendly empty-state message is displayed.
 *
 * @module @/app/newsletter/archive/page
 */

import type React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSentEditions, countSentEditions } from '@/lib/newsletter-db';
import { getSiteUrl } from '@/lib/site-config';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderCellClass,
} from '@/lib/table-styles';

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  return {
    title: 'Newsletter Archive — NBA Reference',
    description: 'Browse all past editions of the NBA Reference daily recap newsletter.',
    alternates: { canonical: `${siteUrl}/newsletter/archive` },
  };
}

const PAGE_SIZE = 20;

interface ArchivePageProps {
  searchParams: Promise<{ page?: string }>;
}

/**
 * Renders a paginated archive of sent newsletter editions.
 *
 * Displays a table of past editions (date, subject, sent time). Shows an
 * empty state when no editions have been sent yet.
 */
export default async function NewsletterArchivePage({
  searchParams,
}: ArchivePageProps): Promise<React.JSX.Element> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.isInteger(Number(pageParam)) ? Number(pageParam) : 1);
  const offset = (page - 1) * PAGE_SIZE;

  const editions = getSentEditions(PAGE_SIZE, offset);
  const total = countSentEditions();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 pt-4 pb-16">
      {/* Header */}
      <section className="fresco-hero relative -mx-4 mb-10 fade-slide-in overflow-hidden px-5 py-10 sm:mx-0 sm:rounded-xl md:px-10 md:py-12">
        <p className="mb-2 editorial-kicker">NBA Reference Newsletter</p>
        <h1 className="font-serif text-3xl font-semibold tracking-[var(--tracking-inscription)]">
          Past Editions
        </h1>
        <p className="mt-3 text-sm text-[color-mix(in_srgb,var(--dc-on-primary)_80%,transparent)]">
          Browse every edition of the daily NBA recap newsletter.
        </p>
      </section>

      {/* Back link */}
      <div className="mb-6 text-sm">
        <Link href="/newsletter" className="text-link underline-offset-2 hover:underline">
          ← Subscribe to the newsletter
        </Link>
      </div>

      {/* Editions table or empty state */}
      <section className="fade-slide-in surface-altar rounded-xl p-5 [animation-delay:120ms]">
        {editions.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <p className="text-2xl" aria-hidden>
              📬
            </p>
            <p className="mt-3 text-base font-medium">No editions yet</p>
            <p className="mt-1 text-sm">
              The first edition will appear here once it&apos;s sent.{' '}
              <Link href="/newsletter" className="text-link underline-offset-2 hover:underline">
                Subscribe now
              </Link>{' '}
              so you don&apos;t miss it!
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-4 inscription-title text-base">
              {total} edition{total !== 1 ? 's' : ''}
            </h2>
            <div className={tableContainerClass}>
              <table className={tableClass}>
                <thead>
                  <tr className={tableHeadRowClass}>
                    <th className={tableHeaderCellClass('left')}>Date</th>
                    <th className={tableHeaderCellClass('left')}>Subject</th>
                    <th className={tableHeaderCellClass('left')}>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {editions.map(edition => (
                    <tr key={edition.edition_id} className={tableBodyRowClass}>
                      <td className={tableCellClass('left')}>{edition.date}</td>
                      <td className={tableCellClass('left')}>{edition.subject_line}</td>
                      <td className={tableCellClass('left')}>
                        {edition.sent_at != null
                          ? new Date(edition.sent_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              timeZoneName: 'short',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="mt-4 flex items-center justify-between text-sm"
                aria-label="Archive pagination"
              >
                <span className="text-muted">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/newsletter/archive?page=${String(page - 1)}`}
                      className="text-link underline-offset-2 hover:underline"
                    >
                      ← Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/newsletter/archive?page=${String(page + 1)}`}
                      className="text-link underline-offset-2 hover:underline"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
