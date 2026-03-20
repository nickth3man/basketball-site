import type { JSX } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { buildPaginationTokens } from '@/lib/pagination';

interface PaginationNavProps {
  currentPage: number;
  pathname: Route;
  query?: Record<string, string | undefined> | undefined;
  summary?: string | undefined;
  totalPages: number;
}

function buildPageHref(
  pathname: Route,
  page: number,
  query: Record<string, string | undefined>
): Route {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value != null && value.length > 0) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const search = params.toString();
  return search.length > 0 ? `${pathname}?${search}` : pathname;
}

export function PaginationNav({
  currentPage,
  pathname,
  query = {},
  summary,
  totalPages,
}: PaginationNavProps): JSX.Element | null {
  if (totalPages <= 1) {
    return summary == null ? null : <p className="mt-3 text-sm text-muted">{summary}</p>;
  }

  const tokens = buildPaginationTokens(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-col gap-3 border-t border-line-soft pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted">{summary}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {currentPage > 1 ? (
          <Link
            href={buildPageHref(pathname, currentPage - 1, query)}
            className="rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded border border-line px-3 py-2 text-muted">Previous</span>
        )}

        {tokens.map((token, index) =>
          token === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-muted">
              ...
            </span>
          ) : token === currentPage ? (
            <span
              key={`page-${token}`}
              aria-current="page"
              className="rounded border border-line bg-paper-soft px-3 py-2 font-semibold text-heading"
            >
              {token}
            </span>
          ) : (
            <Link
              key={`page-${token}`}
              href={buildPageHref(pathname, token, query)}
              className="rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover"
            >
              {token}
            </Link>
          )
        )}

        {currentPage < totalPages ? (
          <Link
            href={buildPageHref(pathname, currentPage + 1, query)}
            className="rounded border border-line bg-button-bg px-3 py-2 hover:bg-button-hover"
          >
            Next
          </Link>
        ) : (
          <span className="rounded border border-line px-3 py-2 text-muted">Next</span>
        )}
      </div>
    </nav>
  );
}
